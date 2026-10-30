from app.database.connection import get_db_connection


def get_resume_by_user_id(user_id: int):

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    file_name,
                    file_path,
                    file_size,
                    content_type,
                    uploaded_at
                FROM resumes
                WHERE user_id = %s
                """,
                (user_id,)
            )

            row = cursor.fetchone()

            if not row:
                return None

            return {
                "id": row[0],
                "file_name": row[1],
                "file_path": row[2],
                "file_size": row[3],
                "content_type": row[4],
                "uploaded_at": row[5],
            }

    finally:
        connection.close()


def save_resume(
    user_id,
    file_name,
    file_path,
    file_size,
    content_type
):

    connection = get_db_connection()

    try:

        with connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO resumes (
                        user_id,
                        file_name,
                        file_path,
                        file_size,
                        content_type
                    )
                    VALUES (%s, %s, %s, %s, %s)

                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        file_name = EXCLUDED.file_name,
                        file_path = EXCLUDED.file_path,
                        file_size = EXCLUDED.file_size,
                        content_type = EXCLUDED.content_type,
                        uploaded_at = CURRENT_TIMESTAMP

                    RETURNING id
                    """,
                    (
                        user_id,
                        file_name,
                        file_path,
                        file_size,
                        content_type,
                    )
                )

                return cursor.fetchone()[0]

    finally:
        connection.close()

def delete_resume_by_user_id(user_id: int):
    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM resumes
                    WHERE user_id = %s
                    RETURNING file_path
                    """,
                    (user_id,)
                )

                row = cursor.fetchone()

                if not row:
                    return None

                return row[0]

    finally:
        connection.close()



def save_resume_profile(
    user_id: int,
    resume_id: int,
    extracted_text: str,
    profile: dict,
):
    """Insert or update the user's extracted resume information."""

    import json
    from app.database.connection import get_db_connection

    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO resume_profiles (
                        user_id,
                        resume_id,
                        extracted_text,
                        skills,
                        projects,
                        education,
                        experience_details,
                        certifications,
                        extraction_status,
                        updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s::jsonb, %s::jsonb,
                        %s::jsonb, %s::jsonb, %s::jsonb,
                        'completed', CURRENT_TIMESTAMP
                    )
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        resume_id = EXCLUDED.resume_id,
                        extracted_text = EXCLUDED.extracted_text,
                        skills = EXCLUDED.skills,
                        projects = EXCLUDED.projects,
                        education = EXCLUDED.education,
                        experience_details = EXCLUDED.experience_details,
                        certifications = EXCLUDED.certifications,
                        extraction_status = 'completed',
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (
                        user_id,
                        resume_id,
                        extracted_text,
                        json.dumps(profile.get("skills", [])),
                        json.dumps(profile.get("projects", [])),
                        json.dumps(profile.get("education", [])),
                        json.dumps(profile.get("experience", [])),
                        json.dumps(profile.get("certifications", [])),
                    ),
                )
    finally:
        connection.close()


def get_resume_profile_by_user_id(user_id: int):
    """Retrieve the user's extracted resume profile."""

    import json
    from app.database.connection import get_db_connection

    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    resume_id,
                    extracted_text,
                    skills,
                    projects,
                    education,
                    experience_details,
                    certifications,
                    extraction_status,
                    updated_at
                FROM resume_profiles
                WHERE user_id = %s
                """,
                (user_id,),
            )

            row = cursor.fetchone()

            if not row:
                return None

            return {
                "resume_id": row[0],
                "extracted_text": row[1],
                "skills": row[2] if not isinstance(row[2], str) else json.loads(row[2]),
                "projects": row[3] if not isinstance(row[3], str) else json.loads(row[3]),
                "education": row[4] if not isinstance(row[4], str) else json.loads(row[4]),
                "experience": row[5] if not isinstance(row[5], str) else json.loads(row[5]),
                "certifications": row[6] if not isinstance(row[6], str) else json.loads(row[6]),
                "extraction_status": row[7],
                "updated_at": row[8],
            }
    finally:
        connection.close()
