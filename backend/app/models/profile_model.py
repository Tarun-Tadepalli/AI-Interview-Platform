from app.database.connection import get_db_connection


def get_profile_by_user_id(user_id: int):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    status,
                    college,
                    degree,
                    graduation_year,
                    target_role,
                    experience,
                    interview_focus,
                    programming_language,
                    role,
                    is_active,
                    terms_accepted
                FROM users
                WHERE id = %s
                """,
                (user_id,)
            )

            row = cursor.fetchone()

            if not row:
                return None

            return {
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "phone": row[4],
                "status": row[5],
                "college": row[6],
                "degree": row[7],
                "graduation_year": row[8],
                "target_role": row[9],
                "experience": row[10],
                "interview_focus": row[11],
                "programming_language": row[12],
                "role": row[13],
                "is_active": row[14],
                "terms_accepted": row[15],
            }

    finally:
        connection.close()


def update_profile(
    user_id: int,
    first_name: str,
    last_name: str,
    phone: str | None,
    status: str,
    college: str,
    degree: str,
    graduation_year: int,
    target_role: str,
    experience: str,
    interview_focus: str,
    programming_language: str,
):
    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE users
                    SET
                        first_name = %s,
                        last_name = %s,
                        phone = %s,
                        status = %s,
                        college = %s,
                        degree = %s,
                        graduation_year = %s,
                        target_role = %s,
                        experience = %s,
                        interview_focus = %s,
                        programming_language = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        status,
                        college,
                        degree,
                        graduation_year,
                        target_role,
                        experience,
                        interview_focus,
                        programming_language,
                        role,
                        is_active,
                        terms_accepted
                    """,
                    (
                        first_name,
                        last_name,
                        phone,
                        status,
                        college,
                        degree,
                        graduation_year,
                        target_role,
                        experience,
                        interview_focus,
                        programming_language,
                        user_id,
                    )
                )

                row = cursor.fetchone()

                if not row:
                    return None

                return {
                    "id": row[0],
                    "first_name": row[1],
                    "last_name": row[2],
                    "email": row[3],
                    "phone": row[4],
                    "status": row[5],
                    "college": row[6],
                    "degree": row[7],
                    "graduation_year": row[8],
                    "target_role": row[9],
                    "experience": row[10],
                    "interview_focus": row[11],
                    "programming_language": row[12],
                    "role": row[13],
                    "is_active": row[14],
                    "terms_accepted": row[15],
                }

    finally:
        connection.close()