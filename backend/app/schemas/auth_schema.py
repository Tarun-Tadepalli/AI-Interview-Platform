from pydantic import BaseModel


class RegisterRequest(BaseModel):

    first_name: str
    last_name: str
    email: str
    phone: str | None = None

    status: str
    college: str
    degree: str
    graduation_year: int

    target_role: str
    experience: str
    interview_focus: str
    programming_language: str

    password: str
    terms: bool


class LoginRequest(BaseModel):

    email: str
    password: str