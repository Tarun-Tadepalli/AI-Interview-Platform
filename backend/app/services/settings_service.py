import re

from app.models.settings_model import (
    update_user_account,
    update_user_password,
    delete_user_account,
)

from app.models.user_model import get_user_by_email

from app.utils.security_util import (
    hash_password,
    verify_password,
)


def update_account(user_id, data):

    return update_user_account(
        user_id=user_id,
        data=data,
    )


def change_password(
    user_id,
    current_password,
    new_password,
    confirm_password,
):

    if new_password != confirm_password:
        raise ValueError(
            "New password and confirm password do not match."
        )

    if len(new_password) < 8:
        raise ValueError(
            "Password must contain at least 8 characters."
        )

    if not re.search(r"[A-Z]", new_password):
        raise ValueError(
            "Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", new_password):
        raise ValueError(
            "Password must contain at least one lowercase letter."
        )

    if not re.search(r"[0-9]", new_password):
        raise ValueError(
            "Password must contain at least one number."
        )

    if not re.search(r"[^A-Za-z0-9]", new_password):
        raise ValueError(
            "Password must contain at least one special character."
        )

    # Get current user
    connection_user = None

    try:
        from app.database.connection import get_db_connection

        connection_user = get_db_connection()

        with connection_user.cursor() as cursor:

            cursor.execute(
                """
                SELECT password_hash
                FROM users
                WHERE id = %s
                """,
                (user_id,),
            )

            row = cursor.fetchone()

    finally:
        if connection_user:
            connection_user.close()

    if not row:
        raise ValueError("User not found.")

    current_password_hash = row[0]

    if not verify_password(
        current_password,
        current_password_hash,
    ):
        raise ValueError(
            "Current password is incorrect."
        )

    new_password_hash = hash_password(
        new_password
    )

    update_user_password(
        user_id=user_id,
        password_hash=new_password_hash,
    )


def delete_account(user_id):

    deleted = delete_user_account(
        user_id=user_id
    )

    if not deleted:
        raise ValueError(
            "Unable to delete account."
        )