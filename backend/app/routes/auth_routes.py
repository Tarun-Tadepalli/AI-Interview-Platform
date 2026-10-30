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


@router.get("/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):

    return {
        "success": True,
        "user": current_user,
    }