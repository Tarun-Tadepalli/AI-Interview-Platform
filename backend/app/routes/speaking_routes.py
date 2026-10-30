import json
import os
import uuid
from datetime import datetime, timezone
import logging



import psycopg2
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from psycopg2.extras import Json

from app.database.connection import get_db_connection
from app.schemas.speaking_schema import SpeakingFinishRequest, SpeakingStartRequest
from app.services.speaking_service import analyze_timing, evaluate_with_gemini, transcribe_audio, _json_safe
from app.utils.auth_dependency_util import get_current_user

router = APIRouter(prefix="/speaking", tags=["Speaking Practice"])
logger = logging.getLogger(__name__)
COOLDOWN_HOURS = 5
MAX_AUDIO_BYTES = 12 * 1024 * 1024
ALLOWED_MODES = {"general", "behavioral", "situational"}
ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}


def _refresh_ask_ai_index(user_id: int):
    from app.services.ask_ai_index_refresh import refresh_user_index
    refresh_user_index(user_id)


def _session_row_to_dict(row):
    if not row:
        return None
    return {"id": str(row[0]), "mode": row[1], "difficulty": row[2], "question_count": row[3], "status": row[4], "started_at": row[5], "completed_at": row[6], "cooldown_until": row[7]}


def _get_user_session(cursor, session_id, user_id, lock=False):
    cursor.execute(
        "SELECT id, user_id, mode, difficulty, question_count, status, started_at, completed_at, cooldown_until, duration_seconds, result_json "
        "FROM speaking_sessions WHERE id = %s AND user_id = %s" + (" FOR UPDATE" if lock else ""),
        (session_id, user_id),
    )
    return cursor.fetchone()


@router.get("/availability")
def speaking_availability(current_user=Depends(get_current_user)):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE speaking_sessions SET status = 'abandoned' WHERE user_id = %s AND status = 'in_progress' AND started_at < NOW() - INTERVAL '30 minutes'",
                (current_user["id"],),
            )
            cursor.execute(
                "SELECT id, mode, difficulty, question_count, status, started_at, completed_at, cooldown_until "
                "FROM speaking_sessions WHERE user_id = %s AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
                (current_user["id"],),
            )
            active = _session_row_to_dict(cursor.fetchone())
            cursor.execute(
                "SELECT completed_at, cooldown_until FROM speaking_sessions WHERE user_id = %s AND status = 'completed' AND cooldown_until > NOW() ORDER BY completed_at DESC LIMIT 1",
                (current_user["id"],),
            )
            locked = cursor.fetchone()
            connection.commit()
        now = datetime.now(timezone.utc)
        if active:
            return {"allowed": False, "reason": "active_session", "active_session": active, "available_at": None, "retry_after_seconds": None}
        if locked:
            until = locked[1]
            seconds = max(0, int((until - now).total_seconds()))
            return {"allowed": False, "reason": "cooldown", "active_session": None, "available_at": until.isoformat(), "retry_after_seconds": seconds}
        return {"allowed": True, "reason": None, "active_session": None, "available_at": None, "retry_after_seconds": 0}
    finally:
        connection.close()


@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_speaking_session(payload: SpeakingStartRequest, current_user=Depends(get_current_user)):
    if payload.mode not in ALLOWED_MODES or payload.difficulty not in ALLOWED_DIFFICULTIES:
        raise HTTPException(status_code=400, detail="Invalid practice mode or difficulty.")
    prompts = [str(p).strip() for p in payload.prompts]
    if len(prompts) < 2 or len(prompts) > 6 or any(not p or len(p) > 500 for p in prompts):
        raise HTTPException(status_code=400, detail="Choose 2–6 valid questions.")

    connection = get_db_connection()
    session_id = str(uuid.uuid4())
    try:
        with connection.cursor() as cursor:
            # Serialize start requests for this user to prevent double-start race conditions.
            cursor.execute("SELECT pg_advisory_xact_lock(73519, %s)", (int(current_user["id"]),))
            cursor.execute("UPDATE speaking_sessions SET status = 'abandoned' WHERE user_id = %s AND status = 'in_progress' AND started_at < NOW() - INTERVAL '30 minutes'", (current_user["id"],))
            cursor.execute("SELECT id FROM speaking_sessions WHERE user_id = %s AND status = 'in_progress' LIMIT 1", (current_user["id"],))
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="You already have a speaking test in progress. Return to it or end that session first.")
            cursor.execute("SELECT cooldown_until FROM speaking_sessions WHERE user_id = %s AND status = 'completed' AND cooldown_until > NOW() ORDER BY completed_at DESC LIMIT 1", (current_user["id"],))
            cooldown = cursor.fetchone()
            if cooldown:
                raise HTTPException(status_code=429, detail={"message": "Your speaking test is temporarily locked for five hours after completion during development testing.", "available_at": cooldown[0].isoformat()})
            cursor.execute(
                "INSERT INTO speaking_sessions (id, user_id, mode, difficulty, question_count, prompts_json, status, started_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'in_progress', NOW())",
                (session_id, current_user["id"], payload.mode, payload.difficulty, len(prompts), Json(prompts)),
            )
        connection.commit()
        return {"session_id": session_id, "status": "in_progress", "question_count": len(prompts), "seconds_per_question": 120}
    except HTTPException:
        connection.rollback()
        raise
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Could not start the speaking session. Check the database and server logs.") from exc
    finally:
        connection.close()


@router.post("/{session_id}/answer")
async def transcribe_speaking_answer(
    session_id: str,
    question_index: int = Form(...),
    prompt: str = Form(...),
    duration_seconds: float = Form(0),
    audio: UploadFile | None = File(None),
    current_user=Depends(get_current_user),
):
    try:
        session_uuid = str(uuid.UUID(session_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid session ID.") from exc
    if question_index < 0 or question_index > 5:
        raise HTTPException(status_code=400, detail="Invalid question index.")
    if audio is None:
        try:
            session_uuid = str(uuid.UUID(session_id))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid session ID.") from exc
        connection = get_db_connection()
        try:
            with connection.cursor() as cursor:
                session = _get_user_session(cursor, session_uuid, current_user["id"], lock=True)
                if not session or session[5] != "in_progress":
                    raise HTTPException(status_code=404, detail="Active speaking session not found.")
                cursor.execute("DELETE FROM speaking_answers WHERE session_id = %s AND question_index = %s", (session_uuid, question_index))
            connection.commit()
            return {"question_index": question_index, "transcript": "", "metrics": analyze_timing("", [], duration_seconds), "words": []}
        except HTTPException:
            connection.rollback()
            raise
        finally:
            connection.close()
    audio_bytes = await audio.read(MAX_AUDIO_BYTES + 1)
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="This answer's audio is too large. Keep answers under 12 MB.")
    if not audio_bytes or len(audio_bytes) < 1000:
        return {"question_index": question_index, "transcript": "", "metrics": analyze_timing("", [], duration_seconds), "words": []}

    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            session = _get_user_session(cursor, session_uuid, current_user["id"], lock=True)
            if not session or session[5] != "in_progress":
                raise HTTPException(status_code=404, detail="Active speaking session not found.")
            prompts = session[10] if isinstance(session[10], list) else []
            if question_index >= session[4]:
                raise HTTPException(status_code=400, detail="Question index is outside this session.")
        try:
            transcription = transcribe_audio(audio_bytes, audio.content_type or "audio/webm")
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        transcript = transcription["transcript"]
        measured_duration = transcription["duration_seconds"] or max(0.1, float(duration_seconds or 0))
        metrics = analyze_timing(transcript, transcription["words"], measured_duration)
        answer_prompt = (prompt or (prompts[question_index] if question_index < len(prompts) else ""))[:500]
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO speaking_answers (session_id, question_index, prompt, transcript, words_json, metrics_json, duration_seconds, transcript_confidence, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW()) "
                "ON CONFLICT (session_id, question_index) DO UPDATE SET prompt = EXCLUDED.prompt, transcript = EXCLUDED.transcript, words_json = EXCLUDED.words_json, metrics_json = EXCLUDED.metrics_json, duration_seconds = EXCLUDED.duration_seconds, transcript_confidence = EXCLUDED.transcript_confidence, updated_at = NOW()",
                (session_uuid, question_index, answer_prompt, transcript, Json(transcription["words"]), Json(metrics), measured_duration, transcription["confidence"]),
            )
        connection.commit()
        return {"question_index": question_index, "transcript": transcript, "words": transcription["words"], "metrics": metrics, "transcript_confidence": transcription["confidence"], "audio_duration_seconds": round(measured_duration, 2)}
    except HTTPException:
        connection.rollback()
        raise
    except Exception as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Could not save or transcribe this answer.") from exc
    finally:
        connection.close()


@router.post("/{session_id}/finish")
def finish_speaking_session(
    session_id: str,
    payload: SpeakingFinishRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    try:
        session_uuid = str(uuid.UUID(session_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid session ID.") from exc
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            session = _get_user_session(cursor, session_uuid, current_user["id"], lock=True)
            if not session:
                raise HTTPException(status_code=404, detail="Speaking session not found.")
            if session[5] == "completed" and session[10]:
                return session[10]
            if session[5] != "in_progress":
                raise HTTPException(status_code=409, detail="This speaking session is no longer active.")
            cursor.execute(
                "SELECT question_index, prompt, transcript, words_json, metrics_json, duration_seconds, transcript_confidence "
                "FROM speaking_answers WHERE session_id = %s ORDER BY question_index",
                (session_uuid,),
            )
            rows = cursor.fetchall()
        termination_reason = payload.termination_reason if payload.termination_reason == "warning_limit" else None
        answers = []
        total_words = 0
        total_duration = 0.0
        total_fillers = 0
        total_pauses = 0
        all_gaps = []
        for row in rows:
            metrics = row[4] if isinstance(row[4], dict) else {}
            transcript = row[2] or ""
            # A proctoring termination evaluates only answers with actual speech.
            # For normal completion, retain the original answer handling unchanged.
            if termination_reason and not transcript.strip():
                continue
            answers.append({"question_index": row[0] + 1, "question": row[1], "transcript": transcript, "transcript_confidence": row[6], "timing": metrics})
            total_words += int(metrics.get("word_count", 0))
            total_duration += float(row[5] or 0)
            total_fillers += int(metrics.get("filler_words", 0))
            total_pauses += int(metrics.get("pause_count", 0))
            all_gaps.extend(metrics.get("pause_gaps_seconds", []))
        has_transcribed_answer = any(answer["transcript"].strip() for answer in answers)
        if not has_transcribed_answer and not termination_reason:
            raise HTTPException(status_code=422, detail="No speech was transcribed. Please return to the session and record at least one answer before finishing.")

        aggregate = {
            "word_count": total_words,
            "speaking_duration_seconds": round(total_duration, 2),
            "words_per_minute": round(total_words / max(total_duration, 0.1) * 60) if total_words else 0,
            "filler_words": total_fillers,
            "pause_count": total_pauses,
            "average_pause_seconds": round(sum(all_gaps) / len(all_gaps), 2) if all_gaps else 0,
            "fluency_score": round(sum(int(a["timing"].get("fluency_score", 0)) for a in answers) / max(len(answers), 1)),
        }
        if has_transcribed_answer:
            try:
                evaluation = evaluate_with_gemini(answers, aggregate)
            except RuntimeError as exc:
                # Keep the session active so the user can retry evaluation without losing their saved answers.
                raise HTTPException(status_code=502, detail=str(exc)) from exc
        else:
            # A test terminated before any speech was transcribed. Save an honest
            # zero-score result instead of sending empty content to Gemini.
            evaluation = {
                "overall_score": 0,
                "relevance": 0,
                "clarity": 0,
                "grammar": 0,
                "vocabulary": 0,
                "structure": 0,
                "summary": "The test ended automatically before any answer could be transcribed, so an AI speaking evaluation was not possible.",
                "strengths": [],
                "improvements": ["Complete at least one spoken answer in a future practice session to receive AI feedback."],
                "answer_feedback": [],
            }

        face_stats = payload.face_stats if isinstance(payload.face_stats, dict) else {}
        face_checks = max(0, int(face_stats.get("checks", 0) or 0))
        missing_face_checks = max(0, int(face_stats.get("face_missing_checks", 0) or 0))
        multiple_face_checks = max(0, int(face_stats.get("face_multiple_checks", 0) or 0))
        detector_ready = face_stats.get("detector_ready") is True

        # Apply a modest penalty only when MediaPipe initialized and actually
        # sampled frames. An unavailable detector must not penalize the candidate.
        camera_penalty = 0
        if detector_ready and face_checks > 0:
            invalid_face_checks = min(face_checks, missing_face_checks + multiple_face_checks)
            camera_penalty = min(15, round((invalid_face_checks / face_checks) * 15))

        base_score = int(round((evaluation.get("overall_score", 0) * 0.8) + (aggregate["fluency_score"] * 0.2)))
        overall = max(0, min(100, base_score - camera_penalty))
        result = {
            "session_id": str(session_uuid),
            "status": "completed",
            "overall_score": max(0, min(100, overall)),
            "answered": sum(1 for a in answers if a["transcript"].strip()),
            "total": session[4],
            "duration_seconds": round(total_duration),
            "words_per_minute": aggregate["words_per_minute"],
            "filler_words": total_fillers,
            "pause_count": total_pauses,
            "average_pause_seconds": aggregate["average_pause_seconds"],
            "metrics": {
                "fluency": aggregate["fluency_score"],
                "relevance": evaluation.get("relevance", 0),
                "clarity": evaluation.get("clarity", 0),
                "grammar": evaluation.get("grammar", 0),
                "vocabulary": evaluation.get("vocabulary", 0),
                "structure": evaluation.get("structure", 0),
            },
            "summary": evaluation.get("summary", ""),
            "strengths": evaluation.get("strengths", []),
            "improvements": evaluation.get("improvements", []),
            "answer_feedback": evaluation.get("answer_feedback", []),
            "answers": answers,
            "face_stats": face_stats,
            "camera_penalty": camera_penalty,
            "camera_warnings": min(3, max(0, int(payload.camera_warnings or 0))),
            "tab_switch_warnings": min(3, max(0, int(payload.tab_switch_warnings or 0))),
            "warning_count": min(3, max(0, int(payload.warning_count or 0))),
            "termination_reason": termination_reason,
            "completion_note": (
                "The test reached three total warnings across camera and tab switching. Results include only answers transcribed before termination."
                if termination_reason == "warning_limit" else None
            ),
            "face_monitoring_note": (
                "Face checks were unavailable, so no camera penalty was applied."
                if not detector_ready or face_checks == 0
                else (f"Camera monitoring reduced the score by {camera_penalty} points because zero or multiple faces were detected in some checks."
                      if camera_penalty else "Exactly one face was detected in the recorded camera checks; no camera penalty was applied.")
            ),
            "evaluation_provider": "Gemini" if has_transcribed_answer else "Not run — no transcribed answers",
        }
        # Convert Decimal and any nested non-JSON-native values before both
        # storing the result in PostgreSQL JSONB and returning it to FastAPI.
        result = _json_safe(result)
        face_stats = _json_safe(face_stats)

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE speaking_sessions SET status = 'completed', completed_at = NOW(), cooldown_until = NOW() + INTERVAL '5 hours', duration_seconds = %s, overall_score = %s, result_json = %s, face_stats_json = %s WHERE id = %s AND user_id = %s",
                (round(total_duration), overall, Json(result), Json(face_stats), session_uuid, current_user["id"]),
            )
        connection.commit()
        # Refresh only after results are committed; indexing failure must not affect scoring.
        background_tasks.add_task(_refresh_ask_ai_index, int(current_user["id"]))
        result["cooldown_until"] = None  # The next availability request returns the exact server-generated time.
        return result
    except HTTPException:
        connection.rollback()
        raise
    except Exception as exc:
        logger.exception("Speaking finish failed")
        connection.rollback()
        raise HTTPException(status_code=500, detail="Could not finish and save speaking results.") from exc
    finally:
        connection.close()


@router.post("/{session_id}/abandon")
def abandon_speaking_session(session_id: str, current_user=Depends(get_current_user)):
    try:
        session_uuid = str(uuid.UUID(session_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid session ID.") from exc
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE speaking_sessions SET status = 'abandoned' WHERE id = %s AND user_id = %s AND status = 'in_progress'", (session_uuid, current_user["id"]))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Active speaking session not found.")
        connection.commit()
        return {"status": "abandoned"}
    except HTTPException:
        connection.rollback()
        raise
    finally:
        connection.close()
