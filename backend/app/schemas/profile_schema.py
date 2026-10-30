from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str | None = None

    status: str
    college: str
    degree: str
    graduation_year: int

    target_role: str
    experience: str
    interview_focus: str
    programming_language: str