from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
)

from app.schemas.typing_schema import (
    TypingResultRequest,
)

from app.services.typing_service import (
    create_typing_result,
    get_user_typing_history,
)

from app.utils.auth_dependency_util import (
    get_current_user,
)


router = APIRouter(
    prefix="/typing",
    tags=["Typing Practice"],
)


@router.post("/result")
def save_typing_result(
    data: TypingResultRequest,
    current_user=Depends(get_current_user),
):

    try:

        result = create_typing_result(
            user_id=current_user["id"],
            data=data,
        )

        return {
            "success": True,
            "message": "Typing result saved successfully.",
            "result": result,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save typing result.",
        )


@router.get("/history")
def get_typing_results(
    current_user=Depends(get_current_user),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
):

    try:

        history = get_user_typing_history(
            user_id=current_user["id"],
            limit=limit,
        )

        return {
            "success": True,
            "history": history,
        }

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load typing history.",
        )