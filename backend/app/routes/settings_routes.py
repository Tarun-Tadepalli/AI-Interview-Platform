from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.settings_schema import (
    UpdateAccountRequest,
    ChangePasswordRequest,
)

from app.services.settings_service import (
    update_account,
    change_password,
    delete_account,
)

from app.utils.auth_dependency_util import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Settings"]
)


@router.patch("/me")
def update_my_account(
    data: UpdateAccountRequest,
    current_user=Depends(get_current_user),
):

    try:

        updated_user = update_account(
            user_id=current_user["id"],
            data=data,
        )

        return {
            "success": True,
            "message": "Account information updated successfully.",
            "user": updated_user,
        }

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.patch("/me/password")
def change_my_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
):

    try:

        change_password(
            user_id=current_user["id"],
            current_password=data.current_password,
            new_password=data.new_password,
            confirm_password=data.confirm_password,
        )

        return {
            "success": True,
            "message": "Password changed successfully.",
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.delete("/me")
def delete_my_account(
    current_user=Depends(get_current_user),
):

    try:

        delete_account(
            user_id=current_user["id"]
        )

        return {
            "success": True,
            "message": "Account deleted successfully.",
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )