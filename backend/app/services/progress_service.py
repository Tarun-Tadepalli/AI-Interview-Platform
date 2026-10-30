from datetime import date, datetime
from decimal import Decimal

from app.database.connection import get_db_connection


ALLOWED_PERIODS = {
    "7 Days": 7,
    "30 Days": 30,
    "90 Days": 90,
    "All Time": None,
}


def _json_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value


def _number(value, fallback=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _int_value(value, fallback=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_item(item):
    result = dict(item)

    result["createdAt"] = result.get(
        "createdAt",
        result.get("created_at")
    )

    result["rawWpm"] = result.get(
        "rawWpm",
        result.get("raw_wpm")
    )

    result["correct"] = result.get(
        "correct",
        result.get("correct_characters")
    )

    result["characters"] = result.get(
        "characters",
        result.get("total_characters")
    )

    result["elapsedSeconds"] = result.get(
        "elapsedSeconds",
        result.get("elapsed_seconds")
    )

    for key, value in list(result.items()):
        result[key] = _json_value(value)

    return result


def _calculate_streak(history):
    dates = []

    for item in history:
        raw_date = item.get("createdAt")

        if not raw_date:
            continue

        try:
            if isinstance(raw_date, str):
                current_date = datetime.fromisoformat(
                    raw_date.replace("Z", "+00:00")
                ).date()
            else:
                current_date = raw_date.date()
        except (ValueError, TypeError):
            continue

        if current_date not in dates:
            dates.append(current_date)

    if not dates:
        return 0

    dates.sort(reverse=True)

    today = date.today()
    days_since_latest = (today - dates[0]).days

    if days_since_latest > 1:
        return 0

    streak = 1

    for index in range(len(dates) - 1):
        difference = (
            dates[index] - dates[index + 1]
        ).days

        if difference == 1:
            streak += 1
        else:
            break

    return streak


def get_progress_summary(
    user_id: int,
    period: str = "30 Days"
):
    if period not in ALLOWED_PERIODS:
        raise ValueError(
            "Invalid progress period."
        )

    days = ALLOWED_PERIODS[period]

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            if days is None:

                cursor.execute(
                    """
                    SELECT *
                    FROM typing_sessions
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 100
                    """,
                    (user_id,)
                )

            else:

                cursor.execute(
                    """
                    SELECT *
                    FROM typing_sessions
                    WHERE user_id = %s
                      AND created_at >=
                          NOW() - (
                              %s * INTERVAL '1 day'
                          )
                    ORDER BY created_at DESC
                    LIMIT 100
                    """,
                    (user_id, days)
                )

            rows = cursor.fetchall()

            columns = [
                column[0]
                for column in cursor.description
            ]

        history = [
            _normalize_item(
                dict(zip(columns, row))
            )
            for row in rows
        ]

        current = (
            history[0]
            if history
            else {}
        )

        wpm_values = [
            _number(item.get("wpm"))
            for item in history
            if _number(item.get("wpm")) > 0
        ]

        accuracy_values = [
            _number(item.get("accuracy"))
            for item in history
            if _number(item.get("accuracy")) > 0
        ]

        summary = {
            "sessions": len(history),

            "currentWpm": _number(
                current.get("wpm")
            ),

            "currentRawWpm": _number(
                current.get("rawWpm")
            ),

            "currentAccuracy": _number(
                current.get("accuracy")
            ),

            "currentErrors": _int_value(
                current.get("errors")
            ),

            "bestWpm": (
                max(wpm_values)
                if wpm_values
                else 0
            ),

            "bestAccuracy": (
                max(accuracy_values)
                if accuracy_values
                else 0
            ),

            "streak": _calculate_streak(
                history
            ),
        }

        return {
            "success": True,
            "module": "typing",
            "period": period,
            "summary": summary,
            "history": history,
        }

    finally:
        connection.close()


def _json_object(value):
    """Return JSON fields as a dictionary, tolerating JSON text from drivers."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        import json
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (TypeError, ValueError):
            return {}
    return {}


def _json_safe(value):
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def get_speaking_progress_summary(user_id: int, period: str = "30 Days"):
    """Return completed Speaking Practice sessions for the authenticated user."""
    if period not in ALLOWED_PERIODS:
        raise ValueError("Invalid progress period.")

    days = ALLOWED_PERIODS[period]
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            if days is None:
                cursor.execute(
                    """
                    SELECT id, user_id, mode, difficulty, question_count, status,
                           started_at, completed_at, overall_score, duration_seconds,
                           result_json, face_stats_json
                    FROM speaking_sessions
                    WHERE user_id = %s AND status = 'completed'
                    ORDER BY completed_at DESC
                    LIMIT 100
                    """,
                    (user_id,),
                )
            else:
                cursor.execute(
                    """
                    SELECT id, user_id, mode, difficulty, question_count, status,
                           started_at, completed_at, overall_score, duration_seconds,
                           result_json, face_stats_json
                    FROM speaking_sessions
                    WHERE user_id = %s
                      AND status = 'completed'
                      AND completed_at >= NOW() - (%s * INTERVAL '1 day')
                    ORDER BY completed_at DESC
                    LIMIT 100
                    """,
                    (user_id, days),
                )
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]

        history = []
        for row in rows:
            item = dict(zip(columns, row))
            result = _json_object(item.get("result_json"))
            metrics = result.get("metrics") or result.get("scores") or {}
            if not isinstance(metrics, dict):
                metrics = {}
            score = _number(item.get("overall_score"))
            completed = item.get("completed_at")
            history.append({
                "id": str(item.get("id")) if item.get("id") is not None else None,
                "userId": item.get("user_id"),
                "mode": item.get("mode") or "general",
                "difficulty": item.get("difficulty") or "easy",
                "questionCount": _int_value(item.get("question_count")),
                "status": item.get("status"),
                "startedAt": _json_safe(item.get("started_at")),
                "completedAt": _json_safe(completed),
                "createdAt": _json_safe(completed),
                "overallScore": score,
                "score": score,
                "durationSeconds": _number(item.get("duration_seconds")),
                "metrics": _json_safe(metrics),
                "summary": result.get("summary", ""),
                "strengths": _json_safe(result.get("strengths") or []),
                "improvements": _json_safe(result.get("improvements") or []),
                "answerFeedback": _json_safe(result.get("answer_feedback") or result.get("answerFeedback") or []),
                "answers": _json_safe(result.get("answers") or []),
                "result": _json_safe(result),
                "faceStats": _json_safe(item.get("face_stats_json") or {}),
            })

        scores = [item["overallScore"] for item in history if item["overallScore"] > 0]
        current = history[0] if history else {}
        summary = {
            "sessions": len(history),
            "currentScore": current.get("overallScore", 0),
            "bestScore": max(scores) if scores else 0,
            "averageScore": round(sum(scores) / len(scores), 2) if scores else 0,
            "currentMode": current.get("mode", ""),
            "currentDifficulty": current.get("difficulty", ""),
            "currentDuration": current.get("durationSeconds", 0),
            "streak": _calculate_streak(history),
        }
        return {"success": True, "module": "speaking", "period": period,
                "summary": summary, "history": history}
    finally:
        connection.close()



def get_interview_progress_summary(user_id: int, period: str = "30 Days"):
    """Return this user's completed, scored interview sessions for the selected period."""
    if period not in ALLOWED_PERIODS:
        raise ValueError("Invalid progress period.")

    days = ALLOWED_PERIODS[period]
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            date_filter = ""
            params = [user_id]
            if days is not None:
                date_filter = " AND s.completed_at >= NOW() - (%s * INTERVAL '1 day')"
                params.append(days)

            cursor.execute(
                f"""
                SELECT
                    s.id,
                    s.interview_type,
                    s.difficulty,
                    s.focus,
                    s.status,
                    s.overall_score,
                    s.started_at,
                    s.completed_at,
                    COALESCE(q.total_questions, 0) AS total_questions,
                    COALESCE(q.answered_questions, 0) AS answered_questions,
                    COALESCE(q.skipped_questions, 0) AS skipped_questions,
                    CASE
                        WHEN s.started_at IS NOT NULL AND s.completed_at IS NOT NULL
                        THEN GREATEST(0, EXTRACT(EPOCH FROM (s.completed_at - s.started_at)))
                        ELSE 0
                    END AS duration_seconds
                FROM interview_sessions s
                LEFT JOIN (
                    SELECT
                        session_id,
                        COUNT(*) FILTER (
                            WHERE question_type IS DISTINCT FROM 'closing'
                        ) AS total_questions,
                        COUNT(*) FILTER (
                            WHERE question_type IS DISTINCT FROM 'closing'
                              AND answer_status = 'answered'
                        ) AS answered_questions,
                        COUNT(*) FILTER (
                            WHERE question_type IS DISTINCT FROM 'closing'
                              AND answer_status <> 'answered'
                        ) AS skipped_questions
                    FROM interview_questions
                    GROUP BY session_id
                ) q ON q.session_id = s.id
                WHERE s.user_id = %s
                  AND s.status = 'completed'
                  AND s.completed_at IS NOT NULL
                  AND s.overall_score IS NOT NULL
                  {date_filter}
                ORDER BY s.completed_at DESC
                LIMIT 100
                """,
                tuple(params),
            )
            rows = cursor.fetchall()
            columns = [column[0] for column in cursor.description]

        history = []
        for row in rows:
            item = dict(zip(columns, row))
            score = _number(item.get("overall_score"))
            completed = item.get("completed_at")
            history.append({
                "id": str(item.get("id")) if item.get("id") is not None else None,
                "mode": item.get("interview_type") or "resume-based",
                "interviewType": item.get("interview_type") or "resume-based",
                "difficulty": item.get("difficulty") or "medium",
                "focus": item.get("focus") or "",
                "status": item.get("status") or "completed",
                "createdAt": _json_safe(completed),
                "completedAt": _json_safe(completed),
                "startedAt": _json_safe(item.get("started_at")),
                "overallScore": score,
                "score": score,
                "totalQuestions": _int_value(item.get("total_questions")),
                "answeredQuestions": _int_value(item.get("answered_questions")),
                "skippedQuestions": _int_value(item.get("skipped_questions")),
                "durationSeconds": _number(item.get("duration_seconds")),
            })

        scores = [item["overallScore"] for item in history]
        current = history[0] if history else {}
        summary = {
            "sessions": len(history),
            "currentScore": current.get("overallScore", 0),
            "bestScore": max(scores) if scores else 0,
            "averageScore": round(sum(scores) / len(scores), 2) if scores else 0,
            "currentMode": current.get("mode", ""),
            "currentDifficulty": current.get("difficulty", ""),
            "currentDuration": current.get("durationSeconds", 0),
            "streak": _calculate_streak(history),
        }
        return {
            "success": True,
            "module": "interview",
            "period": period,
            "summary": summary,
            "history": history,
        }
    finally:
        connection.close()
