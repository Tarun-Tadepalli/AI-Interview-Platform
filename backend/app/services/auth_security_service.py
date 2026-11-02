import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.database.connection import get_db_connection
from app.models.user_model import get_user_by_email
from app.utils.security_util import hash_password, verify_password
from app.services.email_service import (send_password_reset_otp, send_registration_otp) 


# ---------------------------------------------------------
# GENERAL HELPERS
# ---------------------------------------------------------

def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_email_key(email: str) -> str:
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is not configured.")

    return hmac.new(
        secret.encode("utf-8"),
        normalize_email(email).encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def sha256_text(value: str) -> str:
    return hashlib.sha256(
        value.encode("utf-8")
    ).hexdigest()


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter."
        )

    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number."
        )

    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character."
        )

    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 72 UTF-8 bytes or fewer."
        )


def ensure_security_tables(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS auth_security_state (
            email_key CHAR(64) PRIMARY KEY,
            login_failures INTEGER NOT NULL DEFAULT 0,
            login_lock_stage SMALLINT NOT NULL DEFAULT 0,
            blocked_until TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            email_key CHAR(64) PRIMARY KEY,
            otp_hash CHAR(64) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            attempts SMALLINT NOT NULL DEFAULT 0,
            reset_token_hash CHAR(64),
            reset_token_expires_at TIMESTAMPTZ,
            last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def get_block_status(email: str):
    email_key = get_email_key(email)
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            ensure_security_tables(cursor)

            cursor.execute("""
                SELECT blocked_until
                FROM auth_security_state
                WHERE email_key = %s
            """, (email_key,))

            row = cursor.fetchone()
            connection.commit()

            if not row or not row[0]:
                return None

            blocked_until = row[0]

            if blocked_until <= datetime.now(timezone.utc):
                return None

            return blocked_until

    finally:
        connection.close()


def reject_if_blocked(email: str):
    blocked_until = get_block_status(email)

    if not blocked_until:
        return

    remaining = blocked_until - datetime.now(timezone.utc)
    seconds = max(1, int(remaining.total_seconds()))

    if seconds >= 3600:
        duration = f"{seconds // 3600} hour(s)"
    elif seconds >= 60:
        duration = f"{seconds // 60} minute(s)"
    else:
        duration = f"{seconds} second(s)"

    raise HTTPException(
        status_code=429,
        detail=f"Account blocked. Please try again in {duration}."
    )


# ---------------------------------------------------------
# LOGIN FAILURE / LOCKOUT
# ---------------------------------------------------------

def record_failed_login(email: str):
    email_key = get_email_key(email)
    now = datetime.now(timezone.utc)

    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_security_tables(cursor)

                cursor.execute("""
                    INSERT INTO auth_security_state (
                        email_key,
                        login_failures,
                        login_lock_stage,
                        updated_at
                    )
                    VALUES (%s, 1, 0, NOW())
                    ON CONFLICT (email_key)
                    DO UPDATE SET
                        login_failures =
                            auth_security_state.login_failures + 1,
                        updated_at = NOW()
                    RETURNING login_failures, login_lock_stage
                """, (email_key,))

                failures, stage = cursor.fetchone()

                # First three consecutive incorrect passwords.
                if stage == 0 and failures >= 3:
                    block_seconds = 60
                    next_stage = 1

                # First incorrect password after the 1-minute block.
                elif stage == 1:
                    block_seconds = 300
                    next_stage = 2

                # First incorrect password after the 5-minute block.
                elif stage >= 2:
                    block_seconds = 86400
                    next_stage = 3

                else:
                    return

                blocked_until = now + timedelta(
                    seconds=block_seconds
                )

                cursor.execute("""
                    UPDATE auth_security_state
                    SET
                        login_failures = 0,
                        login_lock_stage = %s,
                        blocked_until = %s,
                        updated_at = NOW()
                    WHERE email_key = %s
                """, (
                    next_stage,
                    blocked_until,
                    email_key
                ))

        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect password attempts. "
                f"Account blocked for {block_seconds // 60} minute(s)."
                if block_seconds < 3600
                else "Too many incorrect password attempts. "
                     "Account blocked for 24 hours."
            )
        )

    finally:
        connection.close()


def reset_login_failures(email: str):
    email_key = get_email_key(email)
    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_security_tables(cursor)

                cursor.execute("""
                    INSERT INTO auth_security_state (
                        email_key,
                        login_failures,
                        login_lock_stage,
                        blocked_until,
                        updated_at
                    )
                    VALUES (%s, 0, 0, NULL, NOW())
                    ON CONFLICT (email_key)
                    DO UPDATE SET
                        login_failures = 0,
                        login_lock_stage = 0,
                        blocked_until = NULL,
                        updated_at = NOW()
                """, (email_key,))

    finally:
        connection.close()


def login_with_lockout(email: str, password: str):
    email = normalize_email(email)

    reject_if_blocked(email)

    user = get_user_by_email(email)

    if not user or not user.get("is_active"):
        # Use the same response for unknown email and incorrect password.
        record_failed_login(email)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(password, user["password_hash"]):
        record_failed_login(email)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    reset_login_failures(email)

    return user


# ---------------------------------------------------------
# REQUEST PASSWORD RESET OTP
# ---------------------------------------------------------

def request_password_reset(email: str):
    email = normalize_email(email)
    reject_if_blocked(email)

    email_key = get_email_key(email)
    user = get_user_by_email(email)

    # Do not reveal whether an account exists.
    generic_response = {
        "success": True,
        "message": (
            "If an active account exists for this email, "
            "a verification code has been sent."
        )
    }

    if not user or not user.get("is_active"):
        return generic_response

    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_security_tables(cursor)

                cursor.execute("""
                    SELECT last_sent_at
                    FROM password_reset_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                existing = cursor.fetchone()

                if existing:
                    last_sent_at = existing[0]
                    elapsed = (
                        datetime.now(timezone.utc) - last_sent_at
                    ).total_seconds()

                    if elapsed < 60:
                        wait_seconds = max(
                            1,
                            int(60 - elapsed)
                        )
                        raise HTTPException(
                            status_code=429,
                            detail=(
                                "Please wait "
                                f"{wait_seconds} seconds before requesting "
                                "another verification code."
                            )
                        )

                otp = f"{secrets.randbelow(1000000):06d}"
                otp_hash = sha256_text(otp)

                cursor.execute("""
                    INSERT INTO password_reset_otps (
                        email_key,
                        otp_hash,
                        expires_at,
                        attempts,
                        reset_token_hash,
                        reset_token_expires_at,
                        last_sent_at,
                        created_at
                    )
                    VALUES (
                        %s, %s, %s, 0, NULL, NULL, NOW(), NOW()
                    )
                    ON CONFLICT (email_key)
                    DO UPDATE SET
                        otp_hash = EXCLUDED.otp_hash,
                        expires_at = EXCLUDED.expires_at,
                        attempts = 0,
                        reset_token_hash = NULL,
                        reset_token_expires_at = NULL,
                        last_sent_at = NOW(),
                        created_at = NOW()
                """, (
                    email_key,
                    otp_hash,
                    datetime.now(timezone.utc) + timedelta(minutes=5)
                ))

        # Send only after the database transaction has committed.
        send_password_reset_otp(email, otp)

        return generic_response

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail="Unable to send the verification email. Please try again."
        ) from error

    finally:
        connection.close()


# ---------------------------------------------------------
# VERIFY OTP
# ---------------------------------------------------------

def verify_password_reset_otp(email: str, otp: str):
    email = normalize_email(email)
    reject_if_blocked(email)

    if not otp.isdigit() or len(otp) != 6:
        raise HTTPException(
            status_code=400,
            detail="Enter the valid 6-digit verification code."
        )

    email_key = get_email_key(email)
    connection = get_db_connection()

    remaining_attempts = None
    invalid_message = None
    reset_token = None

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_security_tables(cursor)

                cursor.execute("""
                    SELECT
                        otp_hash,
                        expires_at,
                        attempts
                    FROM password_reset_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                row = cursor.fetchone()

                if not row:
                    invalid_message = (
                        "The verification code is invalid or expired."
                    )

                else:
                    saved_hash, expires_at, attempts = row
                    now = datetime.now(timezone.utc)

                    if expires_at <= now:
                        cursor.execute("""
                            DELETE FROM password_reset_otps
                            WHERE email_key = %s
                        """, (email_key,))

                        invalid_message = (
                            "The verification code has expired. "
                            "Please request a new one."
                        )

                    elif attempts >= 3:
                        invalid_message = (
                            "Maximum verification attempts reached."
                        )

                    elif not hmac.compare_digest(
                        saved_hash.strip(),
                        sha256_text(otp)
                    ):
                        attempts += 1

                        if attempts >= 3:
                            cursor.execute("""
                                INSERT INTO auth_security_state (
                                    email_key,
                                    login_failures,
                                    login_lock_stage,
                                    blocked_until,
                                    updated_at
                                )
                                VALUES (%s, 0, 3, %s, NOW())
                                ON CONFLICT (email_key)
                                DO UPDATE SET
                                    blocked_until = EXCLUDED.blocked_until,
                                    login_lock_stage = 3,
                                    login_failures = 0,
                                    updated_at = NOW()
                            """, (
                                email_key,
                                now + timedelta(hours=24)
                            ))

                            cursor.execute("""
                                DELETE FROM password_reset_otps
                                WHERE email_key = %s
                            """, (email_key,))

                            invalid_message = (
                                "Three incorrect verification attempts. "
                                "Your account is blocked for 24 hours."
                            )

                        else:
                            cursor.execute("""
                                UPDATE password_reset_otps
                                SET attempts = %s
                                WHERE email_key = %s
                            """, (attempts, email_key))

                            remaining_attempts = 3 - attempts

                    else:
                        reset_token = secrets.token_urlsafe(32)

                        cursor.execute("""
                            UPDATE password_reset_otps
                            SET
                                reset_token_hash = %s,
                                reset_token_expires_at = %s
                            WHERE email_key = %s
                        """, (
                            sha256_text(reset_token),
                            now + timedelta(minutes=10),
                            email_key
                        ))

        # The transaction has committed before returning any error.
        if invalid_message:
            if "24 hours" in invalid_message:
                raise HTTPException(
                    status_code=429,
                    detail=invalid_message
                )

            raise HTTPException(
                status_code=400,
                detail=invalid_message
            )

        if remaining_attempts is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Incorrect verification code. "
                    f"{remaining_attempts} attempt(s) remaining."
                )
            )

        return {
            "success": True,
            "message": "Verification successful.",
            "reset_token": reset_token
        }

    finally:
        connection.close()


# ---------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------

def reset_password(email: str, reset_token: str, new_password: str):
    email = normalize_email(email)
    reject_if_blocked(email)
    validate_password(new_password)

    email_key = get_email_key(email)
    token_hash = sha256_text(reset_token)
    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_security_tables(cursor)

                cursor.execute("""
                    SELECT
                        reset_token_hash,
                        reset_token_expires_at
                    FROM password_reset_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                row = cursor.fetchone()

                if not row or not row[0] or not row[1]:
                    raise HTTPException(
                        status_code=400,
                        detail="Password reset session is invalid. "
                               "Please verify your email again."
                    )

                saved_token_hash, token_expires_at = row

                if token_expires_at <= datetime.now(timezone.utc):
                    raise HTTPException(
                        status_code=400,
                        detail="Password reset session expired. "
                               "Please verify your email again."
                    )

                if not hmac.compare_digest(
                    saved_token_hash.strip(),
                    token_hash
                ):
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid password reset session."
                    )

                cursor.execute("""
                    UPDATE users
                    SET password_hash = %s
                    WHERE LOWER(email) = %s
                      AND is_active = TRUE
                    RETURNING id
                """, (
                    hash_password(new_password),
                    email
                ))

                updated_user = cursor.fetchone()

                if not updated_user:
                    raise HTTPException(
                        status_code=400,
                        detail="Unable to update this account's password."
                    )

                cursor.execute("""
                    DELETE FROM password_reset_otps
                    WHERE email_key = %s
                """, (email_key,))

                cursor.execute("""
                    INSERT INTO auth_security_state (
                        email_key,
                        login_failures,
                        login_lock_stage,
                        blocked_until,
                        updated_at
                    )
                    VALUES (%s, 0, 0, NULL, NOW())
                    ON CONFLICT (email_key)
                    DO UPDATE SET
                        login_failures = 0,
                        login_lock_stage = 0,
                        blocked_until = NULL,
                        updated_at = NOW()
                """, (email_key,))

        return {
            "success": True,
            "message": "Your password has been changed successfully."
        }

    finally:
        connection.close()


# ---------------------------------------------------------
# REGISTRATION EMAIL VERIFICATION
# ---------------------------------------------------------

def ensure_registration_otp_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS registration_email_otps (
            email_key CHAR(64) PRIMARY KEY,
            otp_hash CHAR(64) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            attempts SMALLINT NOT NULL DEFAULT 0,
            last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            verification_token_hash CHAR(64),
            verification_token_expires_at TIMESTAMPTZ,
            verified_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def request_registration_otp(email: str):
    email = normalize_email(email)

    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )

    reject_if_blocked(email)

    if get_user_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    email_key = get_email_key(email)
    connection = get_db_connection()
    otp = f"{secrets.randbelow(1000000):06d}"

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_registration_otp_table(cursor)

                cursor.execute("""
                    SELECT last_sent_at
                    FROM registration_email_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                existing = cursor.fetchone()

                if existing:
                    elapsed = (
                        datetime.now(timezone.utc) - existing[0]
                    ).total_seconds()

                    if elapsed < 60:
                        wait = max(1, int(60 - elapsed))
                        raise HTTPException(
                            status_code=429,
                            detail=(
                                f"Please wait {wait} seconds "
                                "before requesting another OTP."
                            )
                        )

                cursor.execute("""
                    INSERT INTO registration_email_otps (
                        email_key,
                        otp_hash,
                        expires_at,
                        attempts,
                        last_sent_at,
                        verification_token_hash,
                        verification_token_expires_at,
                        verified_at,
                        created_at
                    )
                    VALUES (%s, %s, %s, 0, NOW(), NULL, NULL, NULL, NOW())
                    ON CONFLICT (email_key)
                    DO UPDATE SET
                        otp_hash = EXCLUDED.otp_hash,
                        expires_at = EXCLUDED.expires_at,
                        attempts = 0,
                        last_sent_at = NOW(),
                        verification_token_hash = NULL,
                        verification_token_expires_at = NULL,
                        verified_at = NULL,
                        created_at = NOW()
                """, (
                    email_key,
                    sha256_text(otp),
                    datetime.now(timezone.utc) + timedelta(minutes=5)
                ))

        # Send after the database transaction commits.
        send_registration_otp(email, otp)

        return {
            "success": True,
            "message": "A verification code has been sent to your email."
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail="Unable to send the verification email. Please try again."
        ) from error

    finally:
        connection.close()


def verify_registration_otp(email: str, otp: str):
    email = normalize_email(email)
    reject_if_blocked(email)

    if not otp.isdigit() or len(otp) != 6:
        raise HTTPException(
            status_code=400,
            detail="Enter the valid 6-digit verification code."
        )

    if get_user_by_email(email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    email_key = get_email_key(email)
    connection = get_db_connection()

    invalid_message = None
    remaining_attempts = None
    verification_token = None

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_registration_otp_table(cursor)

                cursor.execute("""
                    SELECT otp_hash, expires_at, attempts
                    FROM registration_email_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                row = cursor.fetchone()
                now = datetime.now(timezone.utc)

                if not row:
                    invalid_message = (
                        "Verification code is invalid or expired."
                    )

                else:
                    saved_hash, expires_at, attempts = row

                    if expires_at <= now:
                        cursor.execute("""
                            DELETE FROM registration_email_otps
                            WHERE email_key = %s
                        """, (email_key,))

                        invalid_message = (
                            "OTP expired. Please request a new code."
                        )

                    elif attempts >= 3:
                        invalid_message = (
                            "Maximum OTP attempts reached. "
                            "Please request a new code."
                        )

                    elif not hmac.compare_digest(
                        saved_hash.strip(),
                        sha256_text(otp)
                    ):
                        attempts += 1

                        if attempts >= 3:
                            cursor.execute("""
                                INSERT INTO auth_security_state (
                                    email_key,
                                    login_failures,
                                    login_lock_stage,
                                    blocked_until,
                                    updated_at
                                )
                                VALUES (%s, 0, 3, %s, NOW())
                                ON CONFLICT (email_key)
                                DO UPDATE SET
                                    login_failures = 0,
                                    login_lock_stage = 3,
                                    blocked_until = EXCLUDED.blocked_until,
                                    updated_at = NOW()
                            """, (
                                email_key,
                                now + timedelta(hours=24)
                            ))

                            cursor.execute("""
                                DELETE FROM registration_email_otps
                                WHERE email_key = %s
                            """, (email_key,))

                            invalid_message = (
                                "Three incorrect OTP attempts. "
                                "Verification is blocked for 24 hours."
                            )

                        else:
                            cursor.execute("""
                                UPDATE registration_email_otps
                                SET attempts = %s
                                WHERE email_key = %s
                            """, (attempts, email_key))

                            remaining_attempts = 3 - attempts

                    else:
                        verification_token = secrets.token_urlsafe(32)

                        cursor.execute("""
                            UPDATE registration_email_otps
                            SET
                                verification_token_hash = %s,
                                verification_token_expires_at = %s,
                                verified_at = NOW()
                            WHERE email_key = %s
                        """, (
                            sha256_text(verification_token),
                            now + timedelta(minutes=15),
                            email_key
                        ))

        if invalid_message:
            raise HTTPException(
                status_code=429 if "24 hours" in invalid_message else 400,
                detail=invalid_message
            )

        if remaining_attempts is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Incorrect OTP. "
                    f"{remaining_attempts} attempt(s) remaining."
                )
            )

        return {
            "success": True,
            "message": "Email verified successfully.",
            "verification_token": verification_token
        }

    finally:
        connection.close()


def consume_registration_verification(email: str, token: str):
    email = normalize_email(email)
    reject_if_blocked(email)

    if not token:
        raise ValueError("Please verify your email before registering.")

    email_key = get_email_key(email)
    token_hash = sha256_text(token)
    connection = get_db_connection()

    try:
        with connection:
            with connection.cursor() as cursor:
                ensure_registration_otp_table(cursor)

                cursor.execute("""
                    SELECT
                        verification_token_hash,
                        verification_token_expires_at,
                        verified_at
                    FROM registration_email_otps
                    WHERE email_key = %s
                    FOR UPDATE
                """, (email_key,))

                row = cursor.fetchone()

                if not row:
                    raise ValueError(
                        "Email not verified. Please verify your email first."
                    )

                saved_hash, expires_at, verified_at = row

                if (
                    not verified_at
                    or not expires_at
                    or expires_at <= datetime.now(timezone.utc)
                    or not saved_hash
                    or not hmac.compare_digest(
                        saved_hash.strip(),
                        token_hash
                    )
                ):
                    raise ValueError(
                        "Email verification is invalid or expired. "
                        "Please verify your email again."
                    )

                # Delete the verification record so the token
                # cannot be reused for another registration.
                cursor.execute("""
                    DELETE FROM registration_email_otps
                    WHERE email_key = %s
                """, (email_key,))

    finally:
        connection.close()
