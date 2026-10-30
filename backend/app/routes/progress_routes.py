from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.schemas.progress_schema import ProgressResponse

from app.services.progress_service import (
    ALLOWED_PERIODS,
    get_progress_summary,
    get_speaking_progress_summary,
    get_interview_progress_summary,
)

from app.utils.auth_dependency_util import (
    get_current_user,
)


router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


@router.get(
    "/summary",
    response_model=ProgressResponse
)
def get_progress(
    period: str = Query(
        default="30 Days"
    ),
    current_user=Depends(
        get_current_user
    ),
):

    if period not in ALLOWED_PERIODS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid progress period."
        )

    return get_progress_summary(
        user_id=current_user["id"],
        period=period,
    )

@router.get(
    "/speaking-summary",
    response_model=ProgressResponse
)
def get_speaking_progress(
    period: str = Query(default="30 Days"),
    current_user=Depends(get_current_user),
):
    if period not in ALLOWED_PERIODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid progress period."
        )

    return get_speaking_progress_summary(
        user_id=current_user["id"],
        period=period,
    )



@router.get(
    "/interview-summary",
    response_model=ProgressResponse
)
def get_interview_progress(
    period: str = Query(default="30 Days"),
    current_user=Depends(get_current_user),
):
    if period not in ALLOWED_PERIODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid progress period."
        )

    return get_interview_progress_summary(
        user_id=current_user["id"],
        period=period,
    )
