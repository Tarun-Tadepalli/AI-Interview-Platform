from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.profile_schema import ProfileUpdateRequest

from app.services.profile_service import (
    get_my_profile,
    update_my_profile,
)

from app.utils.auth_dependency_util import get_current_user


router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)


@router.get("/me")
def get_profile(
    current_user=Depends(get_current_user)
):
    try:

        profile = get_my_profile(
            current_user["id"]
        )

        return {
            "success": True,
            "profile": profile,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


@router.put("/me")
def update_profile(
    data: ProfileUpdateRequest,
    current_user=Depends(get_current_user)
):
    try:

        profile = update_my_profile(
            user_id=current_user["id"],
            data=data,
        )

        return {
            "success": True,
            "message": "Profile updated successfully.",
            "profile": profile,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )