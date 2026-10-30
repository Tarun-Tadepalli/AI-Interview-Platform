"""Time-limited adaptive interview API. Uses the existing PostgreSQL tables."""
import os
import json
import re
from concurrent.futures import ThreadPoolExecutor
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from app.database.connection import get_db_connection
from app.utils.auth_dependency_util import get_current_user
from app.services.interview_ai_service import make_question, evaluate_answer

router = APIRouter(prefix="/interview", tags=["Interview Practice"])
DURATION = int(os.getenv("INTERVIEW_DURATION_SECONDS", "600"))
CLOSING_AT = int(os.getenv("INTERVIEW_CLOSING_START_SECONDS", "560"))
MAX_TAB_SWITCHES = int(os.getenv("INTERVIEW_MAX_TAB_SWITCHES", "3"))
COOLDOWN = int(os.getenv("INTERVIEW_COOLDOWN_SECONDS", "21600"))  # Six hours between completed interviews
TYPES = {"resume"}
DIFFICULTIES = {"easy", "medium", "hard"}
FOCUS = {"mixed", "programming", "dsa", "web", "database", "ai", "system"}

class StartRequest(BaseModel):
    interview_type: str = "resume"
    difficulty: str = "medium"
    focus: str = "mixed"
    resume_id: int | None = None

class AnswerRequest(BaseModel):
    question_id: int
    answer_text: str = Field(default="", max_length=20000)
    answer_status: str = "answered"

class TabSwitchRequest(BaseModel):
    count: int = Field(default=1, ge=1, le=10)


def _session(cursor, sid, uid, lock=False):
    cursor.execute("""SELECT id,user_id,resume_id,interview_type,difficulty,focus,total_questions,status,
        current_question_index,overall_score,started_at,completed_at FROM interview_sessions
        WHERE id=%s AND user_id=%s""" + (" FOR UPDATE" if lock else ""), (sid, uid))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(404, "Interview session not found.")
    return row


def _elapsed(started):
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    return max(0, int((datetime.now(timezone.utc) - started).total_seconds()))


def _current_question(cursor, sid):
    cursor.execute("""SELECT id,question_number,question_text,question_type,answer_text,answer_status,
        correctness_score,relevance_score,clarity_score,completeness_score,feedback,suggested_answer
        FROM interview_questions WHERE session_id=%s ORDER BY question_number DESC LIMIT 1""", (sid,))
    row = cursor.fetchone()
    if not row: return None
    return {"id": row[0], "question_number": row[1], "question_text": row[2], "question_type": row[3],
            "answer_text": row[4], "answer_status": row[5], "score": float(row[6]) if row[6] is not None else None,
            "feedback": row[10], "suggested_answer": row[11]}


def _resume_text(cursor, uid, resume_id):
    """Build reliable context from the user's extracted resume profile, including structured fields."""
    try:
        if resume_id:
            cursor.execute("""SELECT extracted_text, skills, projects, education, experience_details, certifications
                FROM resume_profiles WHERE user_id=%s AND resume_id=%s AND extraction_status IN ('success','completed')""", (uid, resume_id))
        else:
            cursor.execute("""SELECT extracted_text, skills, projects, education, experience_details, certifications
                FROM resume_profiles WHERE user_id=%s AND extraction_status IN ('success','completed')
                ORDER BY updated_at DESC LIMIT 1""", (uid,))
        row = cursor.fetchone()
        if not row:
            return ""
        labels = ("RESUME TEXT", "SKILLS", "PROJECTS", "EDUCATION", "EXPERIENCE", "CERTIFICATIONS")
        pieces = []
        for label, value in zip(labels, row):
            if value is None or value == "":
                continue
            if not isinstance(value, str):
                value = json.dumps(value, ensure_ascii=False, default=str)
            elif value.strip().startswith(("[", "{")):
                try:
                    value = json.dumps(json.loads(value), ensure_ascii=False)
                except Exception:
                    pass
            if value.strip():
                pieces.append(f"{label}:\n{value.strip()}")
        return "\n\n".join(pieces)[:12000]
    except Exception:
        # Keep this helper resilient, but don't silently claim resume access in the prompt.
        return ""


def _insert_question(cursor, sid, number, kind, question):
    cursor.execute("""INSERT INTO interview_questions(session_id,question_number,question_text,question_type,answer_status,created_at)
        VALUES(%s,%s,%s,%s,'pending',NOW()) RETURNING id""", (sid, number, question, kind))
    return cursor.fetchone()[0]


def _question_history(cursor, session_id, limit=8):
    """Return recent interview questions and answers for adaptive, non-repeating generation."""
    cursor.execute("""SELECT question_text, answer_text, answer_status
        FROM interview_questions WHERE session_id=%s
        ORDER BY question_number DESC LIMIT %s""", (session_id, limit))
    rows = cursor.fetchall()
    return [
        {"question": row[0] or "", "answer": row[1] or "", "status": row[2] or "pending"}
        for row in reversed(rows)
    ]

@router.post("/{session_id}/transcribe")
async def transcribe_answer(session_id: int, audio: UploadFile = File(...), user=Depends(get_current_user)):
    """Transcribe one captured answer with Deepgram. The key stays server-side."""
    api_key = os.getenv("DEEPGRAM_API_INTERVIEW_KEY", "").strip()
    model = os.getenv("DEEPGRAM_MODEL_INTERVIEW", "nova-2").strip() or "nova-2"
    if not api_key:
        raise HTTPException(503, "DEEPGRAM_API_INTERVIEW_KEY is missing from backend .env")
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            s = _session(cur, session_id, user["id"])
            if s[7] != "in_progress":
                raise HTTPException(409, "Interview is no longer active.")
    finally:
        con.close()
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(400, "No recorded audio was received.")
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(413, "Answer audio is too large. Please speak a shorter answer.")
    content_type = audio.content_type or "audio/webm"
    try:
        # Speech recognition can take several seconds for longer spoken answers.
        # A 4-second timeout caused avoidable gateway errors on otherwise valid audio.
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=8.0)) as client:
            response = await client.post(
                "https://api.deepgram.com/v1/listen",
                params={"model": model, "smart_format": "true", "punctuate": "true", "language": "en"},
                headers={"Authorization": f"Token {api_key}", "Content-Type": content_type},
                content=audio_bytes,
            )
        if response.status_code >= 400:
            upstream_detail = ""
            try:
                upstream_detail = str(response.json().get("err_msg") or response.json().get("message") or "")[:180]
            except Exception:
                upstream_detail = response.text[:180]
            raise HTTPException(502, f"Deepgram returned HTTP {response.status_code}" + (f": {upstream_detail}" if upstream_detail else ". Check the Deepgram key, quota, and model."))
        payload = response.json()
        transcript = payload.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "").strip()
        return {"transcript": transcript, "model": model}
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "Deepgram transcription timed out. Your answer was not submitted; please record and try again.") from exc
    except httpx.RequestError as exc:
        raise HTTPException(502, f"Could not reach Deepgram ({type(exc).__name__}). Your answer was not submitted; please try again.") from exc
    except Exception as exc:
        raise HTTPException(502, f"Deepgram transcription request failed: {type(exc).__name__}") from exc


@router.get("/availability")
def availability(user=Depends(get_current_user)):
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            cur.execute("""UPDATE interview_sessions SET status='completed', completed_at=NOW(), overall_score=NULL
                WHERE user_id=%s AND status='in_progress' AND started_at < NOW() - (%s * INTERVAL '1 second')""", (user["id"], DURATION + 60))
            con.commit()
            cur.execute("SELECT id FROM interview_sessions WHERE user_id=%s AND status='in_progress' LIMIT 1", (user["id"],))
            active = cur.fetchone()
            cur.execute("SELECT completed_at FROM interview_sessions WHERE user_id=%s AND status='completed' AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1", (user["id"],))
            last = cur.fetchone()
            remaining = 0
            if last:
                cur.execute("SELECT GREATEST(0,%s-EXTRACT(EPOCH FROM (NOW()-%s))::INTEGER)", (COOLDOWN,last[0]))
                remaining = cur.fetchone()[0]
            return {"can_start": not active and remaining == 0, "active_session": bool(active), "cooldown_seconds": remaining}
    finally: con.close()

@router.post("/start", status_code=201)
def start(payload: StartRequest, user=Depends(get_current_user)):
    if payload.interview_type != "resume" or payload.difficulty not in DIFFICULTIES:
        raise HTTPException(400, "Only resume-based interviews are supported. Choose easy, medium or hard difficulty.")
    payload.focus = "mixed"
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            # Recover sessions abandoned by a closed browser or expired 10-minute interview.
            cur.execute("""UPDATE interview_sessions SET status='completed', completed_at=NOW(), overall_score=NULL
                WHERE user_id=%s AND status='in_progress' AND started_at < NOW() - (%s * INTERVAL '1 second')""", (user["id"], DURATION + 60))
            cur.execute("SELECT id FROM interview_sessions WHERE user_id=%s AND status='in_progress' LIMIT 1", (user["id"],))
            if cur.fetchone(): raise HTTPException(409, "You already have an interview in progress. Return to that interview or end it before starting another.")
            cur.execute("""SELECT GREATEST(0, %s - EXTRACT(EPOCH FROM (NOW() - completed_at))::INTEGER)
                FROM interview_sessions WHERE user_id=%s AND status='completed' AND completed_at IS NOT NULL
                ORDER BY completed_at DESC LIMIT 1""", (COOLDOWN, user["id"]))
            cooldown_row = cur.fetchone()
            remaining_cooldown = int(cooldown_row[0] or 0) if cooldown_row else 0
            if remaining_cooldown > 0:
                raise HTTPException(429, f"You can start your next interview in {remaining_cooldown} seconds.")
            resume_text = _resume_text(cur, user["id"], payload.resume_id)
            cur.execute("SELECT resume_id FROM resume_profiles WHERE user_id=%s AND extraction_status IN ('success','completed') ORDER BY updated_at DESC LIMIT 1", (user["id"],))
            profile_row = cur.fetchone()
            if not profile_row or not resume_text.strip():
                raise HTTPException(400, "No successfully extracted resume profile was found for this account. Upload or re-process your resume first.")
            chosen_resume_id = profile_row[0]
            question = make_question(payload.interview_type, payload.difficulty, payload.focus, resume_context=resume_text)
            cur.execute("""INSERT INTO interview_sessions(user_id,resume_id,interview_type,difficulty,focus,total_questions,status,current_question_index,started_at)
                VALUES(%s,%s,%s,%s,%s,0,'in_progress',0,NOW()) RETURNING id,started_at""",
                (user["id"],chosen_resume_id,payload.interview_type,payload.difficulty,payload.focus))
            sid, started = cur.fetchone()
            qid = _insert_question(cur,sid,1,payload.interview_type,question)
        con.commit()
        return {"session_id":sid,"status":"in_progress","duration_seconds":DURATION,"elapsed_seconds":0,
                "started_at":started.isoformat(),"welcome_message":"Hi, I'm Nova, your AI interviewer. We'll have a focused, adaptive interview. Please answer clearly and professionally. Let's begin.",
                "question":{"id":qid,"question_number":1,"question_text":question,"question_type":payload.interview_type}}
    except HTTPException: con.rollback(); raise
    except Exception as exc: con.rollback(); raise HTTPException(500, f"Could not start interview: {str(exc)[:300]}")
    finally: con.close()

@router.post("/{session_id}/begin")
def begin_interview_clock(session_id: int, user=Depends(get_current_user)):
    """Start/rebase the official 10-minute clock after Nova's introduction finishes."""
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            session = _session(cur, session_id, user["id"], True)
            if session[7] != "in_progress":
                raise HTTPException(409, "Interview is no longer active.")
            cur.execute("UPDATE interview_sessions SET started_at=NOW() WHERE id=%s AND user_id=%s RETURNING started_at", (session_id, user["id"]))
            started_at = cur.fetchone()[0]
        con.commit()
        return {"session_id": session_id, "started": True, "duration_seconds": DURATION, "started_at": started_at.isoformat()}
    except HTTPException:
        con.rollback()
        raise
    except Exception as exc:
        con.rollback()
        raise HTTPException(500, f"Could not start interview timer: {str(exc)[:200]}")
    finally:
        con.close()


@router.get("/{session_id}")
def get_interview(session_id:int,user=Depends(get_current_user)):
    con=get_db_connection()
    try:
        with con.cursor() as cur:
            s=_session(cur,session_id,user["id"])
            current=_current_question(cur,session_id)
            elapsed=_elapsed(s[10])
            return {"session_id":session_id,"status":s[7],"elapsed_seconds":elapsed,"remaining_seconds":max(0,DURATION-elapsed),
                    "interview_type":s[3],"difficulty":s[4],"focus":s[5],"current_question":current}
    finally: con.close()

@router.post("/{session_id}/answer")
@router.put("/{session_id}/answer")
def answer(session_id: int, payload: AnswerRequest, user=Depends(get_current_user)):
    """Save the answer and generate its evaluation/next question concurrently."""
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            s = _session(cur, session_id, user["id"], True)
            elapsed = _elapsed(s[10])
            if s[7] != "in_progress":
                raise HTTPException(409, "Interview is no longer active.")

            cur.execute(
                "SELECT id,question_text,question_type,question_number,created_at,answer_status "
                "FROM interview_questions WHERE id=%s AND session_id=%s",
                (payload.question_id, session_id),
            )
            q = cur.fetchone()
            if not q:
                raise HTTPException(404, "Question not found.")
            if q[5] != "pending":
                raise HTTPException(409, "This question has already been submitted. Please continue with the current question.")

            # A question created before the 10-minute deadline is allowed its full
            # 60-second answer window. The final closing/feedback question is also
            # allowed after the main interview clock has expired.
            question_is_closing = q[2] == "closing"
            if elapsed >= DURATION and not question_is_closing:
                question_age_at_deadline = (q[4] - s[10]).total_seconds() if q[4] and s[10] else 0
                if question_age_at_deadline >= DURATION:
                    raise HTTPException(409, "This interview question is no longer active.")

            text = payload.answer_text.strip()
            resume_context = _resume_text(cur, user["id"], s[2])
            history = _question_history(cur, session_id, limit=20)
            cur.execute(
                "UPDATE interview_questions SET answer_text=%s,answer_status=%s,answered_at=NOW() WHERE id=%s AND session_id=%s",
                (text, payload.answer_status, q[0], session_id),
            )
            cur.execute("UPDATE interview_sessions SET current_question_index=%s WHERE id=%s", (q[3], session_id))

            # The feedback question is the final turn. Save it, then let the client
            # call /complete immediately without requesting another generated question.
            if question_is_closing:
                con.commit()
                return {
                    "saved": True,
                    "evaluation": {"score": None, "ai_evaluated": False, "feedback": "Closing feedback recorded.", "suggested_answer": ""},
                    "next_question": None,
                    "elapsed_seconds": elapsed,
                    "remaining_seconds": 0,
                    "closing_question": True,
                    "interview_complete": True,
                }

            if payload.answer_status == "answered":
                # Gemini evaluation and adaptive question generation are independent
                # requests. Running them in parallel avoids adding their latencies.
                with ThreadPoolExecutor(max_workers=2) as pool:
                    evaluation_future = pool.submit(evaluate_answer, q[1], text, "resume", resume_context)
                    if elapsed >= DURATION:
                        question_future = None
                        next_text = make_question(s[3], s[4], s[5], closing=True)
                    else:
                        question_future = pool.submit(
                            make_question,
                            s[3], s[4], s[5],
                            previous_question=q[1],
                            previous_answer=text,
                            resume_context=resume_context,
                            question_history=history,
                        )
                        next_text = None
                    evaluation = evaluation_future.result()
                    if question_future is not None:
                        next_text = question_future.result()
            else:
                evaluation = {"score": None, "ai_evaluated": False, "feedback": "Question skipped.", "suggested_answer": ""}
                if elapsed >= DURATION:
                    next_text = make_question(s[3], s[4], s[5], closing=True)
                else:
                    next_text = make_question(
                        s[3], s[4], s[5], previous_question=q[1], previous_answer="",
                        resume_context=resume_context, question_history=history,
                    )

            # If the model calls themselves crossed the 10-minute boundary, the
            # next turn must be the closing/feedback question, never another technical one.
            if _elapsed(s[10]) >= DURATION:
                closing = True
                next_text = make_question(s[3], s[4], s[5], closing=True)
            else:
                closing = False

            evaluated = bool(evaluation.get("ai_evaluated", payload.answer_status == "answered"))
            score_values = (
                evaluation.get("correctness", evaluation.get("score")) if evaluated else None,
                evaluation.get("relevance", evaluation.get("score")) if evaluated else None,
                evaluation.get("clarity", evaluation.get("score")) if evaluated else None,
                evaluation.get("completeness", evaluation.get("score")) if evaluated else None,
            )
            cur.execute(
                "UPDATE interview_questions SET correctness_score=%s,relevance_score=%s,clarity_score=%s,completeness_score=%s,feedback=%s,suggested_answer=%s WHERE id=%s AND session_id=%s",
                (*score_values, evaluation.get("feedback", ""), evaluation.get("suggested_answer", ""), q[0], session_id),
            )

            if next_text is None:
                # A skipped answer after the deadline still needs a final feedback turn.
                closing = True
                next_text = make_question(s[3], s[4], s[5], closing=True)
            next_id = _insert_question(cur, session_id, q[3] + 1, "closing" if closing else s[3], next_text)

        con.commit()
        return {
            "saved": True,
            "evaluation": evaluation,
            "next_question": {"id": next_id, "question_number": q[3] + 1, "question_text": next_text,
                               "question_type": "closing" if closing else s[3]},
            "elapsed_seconds": _elapsed(s[10]),
            "remaining_seconds": max(0, DURATION - _elapsed(s[10])),
            "closing_question": closing,
        }
    except HTTPException:
        con.rollback()
        raise
    except Exception as exc:
        con.rollback()
        raise HTTPException(500, f"Could not save answer: {str(exc)[:300]}")
    finally:
        con.close()

@router.post("/{session_id}/tab-switch")
def tab_switch(session_id:int,payload:TabSwitchRequest,user=Depends(get_current_user)):
    con=get_db_connection()
    try:
        with con.cursor() as cur:
            s=_session(cur,session_id,user["id"],True)
            if s[7] != "in_progress": raise HTTPException(409,"Interview is no longer active.")
            # Store security events in the session's focus field only if schema has no dedicated event table.
            # The client submits cumulative count; the server returns the required action.
            count=payload.count
            terminate=count>=MAX_TAB_SWITCHES
        con.commit()
        return {"tab_switches":count,"warning":not terminate,"terminate":terminate,"message":"Tab switching detected. Return to the interview window." if not terminate else "Interview ended because the tab-switch limit was reached."}
    except HTTPException: con.rollback(); raise
    finally: con.close()

def _refresh_ask_ai_index(user_id: int):
    from app.services.ask_ai_index_refresh import refresh_user_index
    refresh_user_index(user_id)


@router.post("/{session_id}/complete")
def complete(
    session_id: int,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    con=get_db_connection()
    try:
        with con.cursor() as cur:
            s=_session(cur,session_id,user["id"],True)
            if s[7] == "completed": raise HTTPException(409,"Interview already completed.")
            if s[7] != "in_progress": raise HTTPException(409,"Interview is not active.")
            elapsed=min(DURATION,_elapsed(s[10]))
            cur.execute("UPDATE interview_questions SET answer_status='skipped' WHERE session_id=%s AND answer_status='pending'",(session_id,))
            cur.execute("""SELECT COUNT(*) FILTER(WHERE answer_status='answered' AND question_type <> 'closing'),
                COUNT(*) FILTER(WHERE question_type <> 'closing'),
                AVG(correctness_score) FILTER(WHERE answer_status='answered' AND question_type <> 'closing'),
                COUNT(correctness_score) FILTER(WHERE answer_status='answered' AND question_type <> 'closing')
                FROM interview_questions WHERE session_id=%s AND question_type <> 'closing'""",(session_id,))
            answered,total,avg,evaluated_count=cur.fetchone()
            # Never invent a score if the AI evaluator failed for every answer.
            if not evaluated_count:
                score = None
            else:
                quality=float(avg or 0)
                completion=min(1.0, evaluated_count/max(1,total))
                score=round(max(0,min(100,quality*(0.8+0.2*completion))))
            cur.execute("UPDATE interview_sessions SET status='completed',completed_at=NOW(),overall_score=%s,total_questions=%s,current_question_index=%s WHERE id=%s AND user_id=%s RETURNING completed_at",(score,total,total,session_id,user["id"]))
            completed=cur.fetchone()[0]
            cur.execute("""SELECT question_number,question_text,answer_text,answer_status,
                correctness_score,relevance_score,clarity_score,completeness_score,feedback,suggested_answer,question_type,
                CASE WHEN answered_at IS NOT NULL AND created_at IS NOT NULL
                     THEN GREATEST(0, EXTRACT(EPOCH FROM (answered_at-created_at))::INTEGER) ELSE NULL END AS answer_seconds
                FROM interview_questions WHERE session_id=%s ORDER BY question_number""", (session_id,))
            rows=cur.fetchall()
            report=[]
            for row in rows:
                if row[10] == "closing":
                    continue
                report.append({
                    "question_number": row[0], "question": row[1], "answer": row[2] or "",
                    "status": row[3],
                    "correctness": float(row[4]) if row[4] is not None else None,
                    "relevance": float(row[5]) if row[5] is not None else None,
                    "clarity": float(row[6]) if row[6] is not None else None,
                    "completeness": float(row[7]) if row[7] is not None else None,
                    "feedback": row[8] or "", "suggested_answer": row[9] or "",
                    "answer_seconds": row[11]
                })
        con.commit()
        # Index the committed scorecard in the background; don't delay or undo completion.
        background_tasks.add_task(_refresh_ask_ai_index, int(user["id"]))
        answered_reports=[x for x in report if x["status"]=="answered"]
        evaluated_reports=[x for x in answered_reports if x["correctness"] is not None]
        avg_correctness=round(sum(x["correctness"] for x in evaluated_reports)/len(evaluated_reports),1) if evaluated_reports else None
        avg_relevance=round(sum(x["relevance"] for x in evaluated_reports)/len(evaluated_reports),1) if evaluated_reports else None
        avg_clarity=round(sum(x["clarity"] for x in evaluated_reports)/len(evaluated_reports),1) if evaluated_reports else None
        avg_completeness=round(sum(x["completeness"] for x in evaluated_reports)/len(evaluated_reports),1) if evaluated_reports else None
        return {"session_id":session_id,"status":"completed","completed_at":completed.isoformat(),"elapsed_seconds":elapsed,
                "answered_questions":answered,"total_questions":total,"skipped_questions":max(0,total-answered),"overall_score":score,
                "dimension_scores":{"correctness":avg_correctness,"relevance":avg_relevance,"clarity":avg_clarity,"completeness":avg_completeness},
                "answer_feedback":report,
                "message":"AI evaluation report generated from saved answers. Review the per-question feedback and suggested answers below."}
    except HTTPException: con.rollback(); raise
    except Exception as exc: con.rollback(); raise HTTPException(500,f"Could not complete interview: {str(exc)[:300]}")
    finally: con.close()

@router.post("/{session_id}/terminate")
def terminate(session_id: int, user=Depends(get_current_user)):
    """Explicitly terminate an active interview (used by logout and End Interview)."""
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            s = _session(cur, session_id, user["id"], True)
            if s[7] == "in_progress":
                cur.execute("UPDATE interview_questions SET answer_status='skipped' WHERE session_id=%s AND answer_status='pending'", (session_id,))
                cur.execute("UPDATE interview_sessions SET status='completed', completed_at=NOW(), overall_score=NULL WHERE id=%s AND user_id=%s", (session_id, user["id"]))
        con.commit()
        return {"terminated": True, "session_id": session_id, "message": "Interview ended. No final score was generated because the interview was terminated early."}
    except HTTPException:
        con.rollback(); raise
    except Exception as exc:
        con.rollback(); raise HTTPException(500, f"Could not terminate interview: {type(exc).__name__}")
    finally:
        con.close()


@router.get("/{session_id}/report")
def get_report(session_id: int, user=Depends(get_current_user)):
    """Return the persisted final scorecard for this user's completed interview."""
    con = get_db_connection()
    try:
        with con.cursor() as cur:
            s = _session(cur, session_id, user["id"])
            if s[7] != "completed":
                raise HTTPException(409, "The scorecard is available after the interview is completed.")
            cur.execute("""SELECT question_number, question_text, answer_text, answer_status,
                correctness_score, relevance_score, clarity_score, completeness_score, feedback, suggested_answer, question_type,
                CASE WHEN answered_at IS NOT NULL AND created_at IS NOT NULL
                     THEN GREATEST(0, EXTRACT(EPOCH FROM (answered_at-created_at))::INTEGER) ELSE NULL END AS answer_seconds
                FROM interview_questions WHERE session_id=%s ORDER BY question_number""", (session_id,))
            rows = cur.fetchall()
        report = []
        for row in rows:
            if row[10] == "closing":
                continue
            report.append({"question_number": row[0], "question": row[1], "answer": row[2] or "", "status": row[3],
                "correctness": float(row[4]) if row[4] is not None else None,
                "relevance": float(row[5]) if row[5] is not None else None,
                "clarity": float(row[6]) if row[6] is not None else None,
                "completeness": float(row[7]) if row[7] is not None else None,
                "feedback": row[8] or "", "suggested_answer": row[9] or "", "answer_seconds": row[11]})
        scored = [x for x in report if x["status"] == "answered" and x["correctness"] is not None]
        def avg(key):
            return round(sum(x[key] for x in scored) / len(scored), 1) if scored else None
        return {"session_id": session_id, "status": s[7], "interview_type": s[3], "difficulty": s[4],
            "overall_score": float(s[9]) if s[9] is not None else None,
            "completed_at": s[11].isoformat() if s[11] else None,
            "total_questions": len(report), "answered_questions": sum(x["status"] == "answered" for x in report),
            "skipped_questions": sum(x["status"] != "answered" for x in report),
            "dimension_scores": {"correctness": avg("correctness"), "relevance": avg("relevance"), "clarity": avg("clarity"), "completeness": avg("completeness")},
            "answer_feedback": report}
    finally:
        con.close()


@router.get("/history/list")
def history(user=Depends(get_current_user)):
    con=get_db_connection()
    try:
        with con.cursor() as cur:
            cur.execute("SELECT id,interview_type,difficulty,focus,status,overall_score,started_at,completed_at FROM interview_sessions WHERE user_id=%s ORDER BY started_at DESC LIMIT 30",(user["id"],))
            return {"sessions":[{"id":r[0],"interview_type":r[1],"difficulty":r[2],"focus":r[3],"status":r[4],"overall_score":float(r[5]) if r[5] is not None else None,"started_at":r[6].isoformat() if r[6] else None,"completed_at":r[7].isoformat() if r[7] else None} for r in cur.fetchall()]}
    finally: con.close()
