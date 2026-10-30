from app.database.connection import get_db_connection


def save_typing_session(
    user_id,
    mode,
    time_limit,
    word_limit,
    punctuation,
    numbers,
    wpm,
    raw_wpm,
    accuracy,
    correct_characters,
    characters,
    errors,
    elapsed_seconds,
):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO typing_sessions (
                    user_id,
                    mode,
                    time_limit,
                    word_limit,
                    punctuation,
                    numbers,
                    wpm,
                    raw_wpm,
                    accuracy,
                    correct_characters,
                    characters,
                    errors,
                    elapsed_seconds
                )
                VALUES (
                    %s, %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s
                )
                RETURNING
                    id,
                    user_id,
                    mode,
                    time_limit,
                    word_limit,
                    punctuation,
                    numbers,
                    wpm,
                    raw_wpm,
                    accuracy,
                    correct_characters,
                    characters,
                    errors,
                    elapsed_seconds,
                    created_at
                """,
                (
                    user_id,
                    mode,
                    time_limit,
                    word_limit,
                    punctuation,
                    numbers,
                    wpm,
                    raw_wpm,
                    accuracy,
                    correct_characters,
                    characters,
                    errors,
                    elapsed_seconds,
                ),
            )

            row = cursor.fetchone()

            connection.commit()

            return row

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def get_typing_history(user_id, limit=50):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    mode,
                    time_limit,
                    word_limit,
                    punctuation,
                    numbers,
                    wpm,
                    raw_wpm,
                    accuracy,
                    correct_characters,
                    characters,
                    errors,
                    elapsed_seconds,
                    created_at
                FROM typing_sessions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )

            rows = cursor.fetchall()

            return rows

    finally:
        connection.close()