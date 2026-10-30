from app.database.connection import get_db_connection


def get_user_by_email(email: str):

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
                    password_hash,
                    role,
                    is_active,
                    terms_accepted
                FROM users
                WHERE email = %s
                """,
                (email,)
            )

            row = cursor.fetchone()

            if not row:
                return None

            columns = [
                "id",
                "first_name",
                "last_name",
                "email",
                "phone",
                "status",
                "college",
                "degree",
                "graduation_year",
                "target_role",
                "experience",
                "interview_focus",
                "programming_language",
                "password_hash",
                "role",
                "is_active",
                "terms_accepted",
            ]

            return dict(zip(columns, row))

    finally:
        connection.close()


def create_user(
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
    password_hash,
    terms_accepted
):

    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO users (
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
                        password_hash,
                        terms_accepted
                    )
                    VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s
                    )
                    RETURNING id, role
                    """,
                    (
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
                        password_hash,
                        terms_accepted,
                    )
                )

                return cursor.fetchone()

    finally:
        connection.close()