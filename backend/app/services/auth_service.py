import re

from app.models.user_model import (
    create_user,
    get_user_by_email,
)
from app.utils.security_util import (
    create_access_token,
    hash_password,
    verify_password,
)

from app.services.auth_security_service import (login_with_lockout, consume_registration_verification,)


def validate_email(email: str) -> bool:

    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    return re.match(pattern, email) is not None


def validate_password(password: str) -> bool:

    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"[0-9]", password):
        return False

    if not re.search(r"[^A-Za-z0-9]", password):
        return False

    return True


def register_new_user(data):

    email = data.email.strip().lower()

    if not validate_email(email):
        raise ValueError("Please enter a valid email address.")

    if not validate_password(data.password):
        raise ValueError(
            "Password must contain at least 8 characters, "
            "one uppercase letter, one lowercase letter, "
            "one number, and one special character."
        )

    if len(data.password.encode("utf-8")) > 72:
        raise ValueError(
            "Password must be 72 characters or fewer."
        )

    if not data.terms:
        raise ValueError(
            "Please accept the Terms of Service and Privacy Policy."
        )

    existing_user = get_user_by_email(email)

    if existing_user:
        raise ValueError(
            "An account with this email already exists."
        )
    # Registration is permitted only after backend email verification.
    consume_registration_verification(
        email=email,
        token=data.email_verification_token
    )

    password_hash = hash_password(data.password)

    user_id, role = create_user(
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        email=email,
        phone=data.phone.strip() if data.phone else None,
        status=data.status,
        college=data.college.strip(),
        degree=data.degree.strip(),
        graduation_year=data.graduation_year,
        target_role=data.target_role,
        experience=data.experience,
        interview_focus=data.interview_focus,
        programming_language=data.programming_language,
        password_hash=password_hash,
        terms_accepted=data.terms,
    )

    token = create_access_token(
        user_id=user_id,
        role=role,
        expires_minutes=60
    )

    return {
        "user_id": user_id,
        "role": role,
        "token": token,
        "email": email,
    }


def login_user(email: str, password: str):

    user = login_with_lockout(email, password)

    token = create_access_token(
        user_id=user["id"],
        role=user["role"]
    )

    return {
        "token": token,
        "user_id": user["id"],
        "role": user["role"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
    }