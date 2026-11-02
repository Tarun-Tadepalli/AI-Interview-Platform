from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
)
from app.services.auth_service import (
    login_user,
    register_new_user,
)
from app.utils.auth_dependency_util import get_current_user

from app.schemas.password_reset_schema import (
    ForgotPasswordRequest,
    VerifyResetOtpRequest,
    ResetPasswordRequest,
)

from app.services.auth_security_service import (
    request_password_reset,
    verify_password_reset_otp,
    reset_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(data: RegisterRequest):

    try:

        result = register_new_user(data)

        return {
            "success": True,
            "message": "Registration successful.",
            **result,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.post("/login")
def login(data: LoginRequest):

    try:

        result = login_user(
            email=data.email,
            password=data.password
        )

        return {
            "success": True,
            "message": "Login successful.",
            **result,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )
    
@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    return request_password_reset(data.email)


@router.post("/verify-reset-otp")
def verify_reset_otp(data: VerifyResetOtpRequest):
    return verify_password_reset_otp(
        email=data.email,
        otp=data.otp
    )


@router.post("/reset-password")
def change_password(data: ResetPasswordRequest):
    return reset_password(
        email=data.email,
        reset_token=data.reset_token,
        new_password=data.password
    )


@router.get("/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):

    return {
        "success": True,
        "user": current_user,
    }