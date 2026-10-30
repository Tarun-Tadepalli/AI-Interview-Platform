from datetime import date, datetime
from decimal import Decimal
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.database.connection import get_db_connection
from app.utils.auth_dependency_util import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


def _json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def _number(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _date_label(value):
    if not value:
        return None
    if isinstance(value, str):
        return value
    return value.isoformat()


def _fetch_dicts(cursor):
    columns = [item[0] for item in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


@router.get("/summary")
def get_dashboard_summary(current_user=Depends(get_current_user)):
    """
    Live, user-scoped dashboard summary. Reads existing practice tables only;
    it does not create tables, modify practice data, or generate synthetic scores.
    """
    connection = get_db_connection()
    user_id = current_user["id"]

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT wpm, accuracy, elapsed_seconds, created_at
                FROM typing_sessions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (user_id,),
            )
            typing_rows = _fetch_dicts(cursor)

            cursor.execute(
                """
                SELECT id, mode, difficulty, status, started_at, completed_at,
                       duration_seconds, overall_score, result_json
                FROM speaking_sessions
                WHERE user_id = %s
                ORDER BY COALESCE(completed_at, started_at) DESC
                LIMIT 100
                """,
                (user_id,),
            )
            speaking_rows = _fetch_dicts(cursor)

            cursor.execute(
                """
                SELECT id, interview_type, difficulty, status, overall_score,
                       started_at, completed_at
                FROM interview_sessions
                WHERE user_id = %s
                ORDER BY COALESCE(completed_at, started_at) DESC
                LIMIT 100
                """,
                (user_id,),
            )
            interview_rows = _fetch_dicts(cursor)

            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT 1 FROM resume_profiles
                    WHERE user_id = %s
                      AND extraction_status IN ('success', 'completed')
                )
                """,
                (user_id,),
            )
            resume_exists = bool(cursor.fetchone()[0])

            # Scores below are computed only from saved, completed records.
            cursor.execute(
                """
                SELECT AVG(correctness_score), AVG(relevance_score),
                       AVG(clarity_score), AVG(completeness_score)
                FROM interview_questions q
                JOIN interview_sessions s ON s.id = q.session_id
                WHERE s.user_id = %s
                  AND s.status = 'completed'
                  AND q.answer_status = 'answered'
                  AND q.question_type <> 'closing'
                """,
                (user_id,),
            )
            dimension_row = cursor.fetchone()

        typing_completed = [row for row in typing_rows if row.get("wpm") is not None]
        speaking_completed = [
            row for row in speaking_rows
            if row.get("status") == "completed" and row.get("completed_at") is not None
        ]
        interview_completed = [
            row for row in interview_rows
            if row.get("status") == "completed" and row.get("completed_at") is not None
        ]

        typing_wpm = [_number(row.get("wpm")) for row in typing_completed]
        typing_wpm = [value for value in typing_wpm if value is not None]
        typing_accuracy = [_number(row.get("accuracy")) for row in typing_completed]
        typing_accuracy = [value for value in typing_accuracy if value is not None]

        speaking_scores = [_number(row.get("overall_score")) for row in speaking_completed]
        speaking_scores = [value for value in speaking_scores if value is not None]
        interview_scores = [_number(row.get("overall_score")) for row in interview_completed]
        interview_scores = [value for value in interview_scores if value is not None]

        all_saved_scores = speaking_scores + interview_scores
        average_score = round(sum(all_saved_scores) / len(all_saved_scores), 1) if all_saved_scores else None
        average_speaking = round(sum(speaking_scores) / len(speaking_scores), 1) if speaking_scores else None
        average_interview = round(sum(interview_scores) / len(interview_scores), 1) if interview_scores else None
        average_wpm = round(sum(typing_wpm) / len(typing_wpm), 1) if typing_wpm else None
        average_accuracy = round(sum(typing_accuracy) / len(typing_accuracy), 1) if typing_accuracy else None

        # Readiness is explicitly a simple summary of the available measured indicators.
        readiness_values = []
        if average_interview is not None:
            readiness_values.append(average_interview)
        if average_speaking is not None:
            readiness_values.append(average_speaking)
        if average_accuracy is not None:
            readiness_values.append(average_accuracy)
        readiness = round(sum(readiness_values) / len(readiness_values)) if readiness_values else None

        activity = []
        for row in typing_completed:
            activity.append({
                "id": f"typing-{row.get('created_at')}",
                "title": "Typing Practice",
                "type": "Typing",
                "score": _number(row.get("accuracy")),
                "metric": f"{row.get('wpm')} WPM" if row.get("wpm") is not None else None,
                "date": _date_label(row.get("created_at")),
                "timestamp": row.get("created_at"),
                "path": "/typing",
            })
        for row in speaking_completed:
            activity.append({
                "id": f"speaking-{row.get('id')}",
                "title": f"{row.get('mode') or 'General'} Speaking Practice",
                "type": "Speaking",
                "score": _number(row.get("overall_score")),
                "metric": f"{row.get('overall_score')}%" if row.get("overall_score") is not None else None,
                "date": _date_label(row.get("completed_at")),
                "timestamp": row.get("completed_at"),
                "path": "/speaking",
            })
        for row in interview_completed:
            activity.append({
                "id": f"interview-{row.get('id')}",
                "title": f"{row.get('interview_type') or 'Resume-based'} Interview",
                "type": "Interview",
                "score": _number(row.get("overall_score")),
                "metric": f"{row.get('overall_score')}%" if row.get("overall_score") is not None else None,
                "date": _date_label(row.get("completed_at")),
                "timestamp": row.get("completed_at"),
                "path": "/interview",
            })
        activity.sort(key=lambda item: item.get("timestamp") or "", reverse=True)

        # Derive a consecutive-day streak from the dates of actual completed sessions.
        activity_dates = set()
        for item in activity:
            raw = item.get("timestamp")
            try:
                parsed = raw.date() if hasattr(raw, "date") else datetime.fromisoformat(str(raw).replace("Z", "+00:00")).date()
                activity_dates.add(parsed)
            except (ValueError, TypeError):
                continue
        today = date.today()
        streak = 0
        day = today if today in activity_dates else date.fromordinal(today.toordinal() - 1)
        while day in activity_dates:
            streak += 1
            day = date.fromordinal(day.toordinal() - 1)

        labels = ["Correctness", "Relevance", "Clarity", "Completeness"]
        weak_areas = []
        for label, value in zip(labels, dimension_row or (None, None, None, None)):
            score = _number(value)
            if score is not None:
                weak_areas.append({
                    "name": label,
                    "score": round(score),
                    "level": "Strong area" if score >= 80 else ("Keep practicing" if score >= 65 else "Needs attention"),
                })
        weak_areas.sort(key=lambda item: item["score"])

        completed_count = len(interview_completed) + len(speaking_completed) + len(typing_completed)
        return {
            "user": {
                "first_name": current_user.get("first_name") or "",
                "last_name": current_user.get("last_name") or "",
            },
            "stats": {
                "interviews_completed": len(interview_completed),
                "average_score": average_score,
                "speaking_score": average_speaking,
                "typing_wpm": average_wpm,
                "typing_accuracy": average_accuracy,
                "typing_sessions": len(typing_completed),
                "speaking_sessions": len(speaking_completed),
                "practice_sessions": completed_count,
            },
            "readiness": readiness,
            "streak_days": streak,
            "resume": {"available": resume_exists},
            "recent_activity": activity[:5],
            "weak_areas": weak_areas[:3],
            "generated_at": datetime.now().astimezone().isoformat(),
        }
    except Exception as exc:
        logger.exception("Dashboard summary query failed")
        raise HTTPException(status_code=500, detail="Could not load your dashboard summary. Check the backend log for the database error.") from exc
    finally:
        connection.close()
