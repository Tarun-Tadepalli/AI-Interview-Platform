from app.database.connection import get_db_connection


def update_user_account(user_id, data):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            update_fields = []
            values = []

            # -----------------------------------------
            # EMAIL
            # -----------------------------------------
            if getattr(data, "email", None) is not None:
                email = data.email.strip().lower()

                update_fields.append("email = %s")
                values.append(email)

            # -----------------------------------------
            # PHONE
            # -----------------------------------------
            if getattr(data, "phone", None) is not None:
                phone = data.phone.strip()

                update_fields.append("phone = %s")
                values.append(phone if phone else None)

            # -----------------------------------------
            # NOTHING TO UPDATE
            # -----------------------------------------
            if not update_fields:
                return None

            values.append(user_id)

            query = f"""
                UPDATE users
                SET
                    {", ".join(update_fields)},
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
            """

            cursor.execute(query, tuple(values))

            row = cursor.fetchone()

            if not row:
                return None

            connection.commit()

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

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_user_password(user_id, password_hash):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                UPDATE users
                SET
                    password_hash = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (password_hash, user_id),
            )

            connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def delete_user_account(user_id):
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                DELETE FROM users
                WHERE id = %s
                RETURNING id
                """,
                (user_id,),
            )

            deleted = cursor.fetchone()

            connection.commit()

            return deleted is not None

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()