from pydantic import BaseModel, Field


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class VerifyResetOtpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    otp: str = Field(min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    reset_token: str = Field(min_length=20)
    password: str = Field(min_length=8)