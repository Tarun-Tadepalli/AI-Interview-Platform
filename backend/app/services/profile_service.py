from app.models.profile_model import (
    get_profile_by_user_id,
    update_profile,
)


def get_my_profile(user_id: int):
    profile = get_profile_by_user_id(user_id)

    if not profile:
        raise ValueError("User profile not found.")

    return profile


def update_my_profile(user_id: int, data):
    profile = update_profile(
        user_id=user_id,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        phone=data.phone.strip() if data.phone else None,
        status=data.status,
        college=data.college.strip(),
        degree=data.degree.strip(),
        graduation_year=data.graduation_year,
        target_role=data.target_role,
        experience=data.experience,
        interview_focus=data.interview_focus,
        programming_language=data.programming_language,
    )

    if not profile:
        raise ValueError("Unable to update profile.")

    return profile