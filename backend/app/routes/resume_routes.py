from pathlib import Path
from uuid import uuid4
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    BackgroundTasks
)
from fastapi.responses import FileResponse


from app.models.resume_model import (
    get_resume_by_user_id,
    save_resume,
    delete_resume_by_user_id,
    save_resume_profile
)
from app.utils.auth_dependency_util import get_current_user

from app.services.resume_extraction_service import (
    extract_pdf_text,
    structure_resume_with_gemini,
)


router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


BASE_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BASE_DIR / "uploads" / "resumes"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)


MAX_FILE_SIZE = 5 * 1024 * 1024


def _refresh_ask_ai_index(user_id: int):
    from app.services.ask_ai_index_refresh import refresh_user_index
    refresh_user_index(user_id)


@router.get("/me")
async def get_my_resume(
    current_user=Depends(get_current_user)
):
    resume = get_resume_by_user_id(
        current_user["id"]
    )

    if not resume:
        return {
            "success": True,
            "resume": None
        }

    return {
        "success": True,
        "resume": {
            "id": resume["id"],
            "file_name": resume["file_name"],
            "file_size": resume["file_size"],
            "content_type": resume["content_type"],
            "uploaded_at": resume["uploaded_at"],
        }
    }


@router.get("/view")
async def view_my_resume(
    current_user=Depends(get_current_user)
):
    resume = get_resume_by_user_id(
        current_user["id"]
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found."
        )

    file_path = Path(
        resume["file_path"]
    )

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found."
        )

    return FileResponse(
        path=file_path,
        media_type=resume["content_type"],
        filename=resume["file_name"],
        content_disposition_type="inline",
    )


@router.delete("/me")
async def delete_my_resume(
    current_user=Depends(get_current_user)
):
    file_path = delete_resume_by_user_id(
        current_user["id"]
    )

    if not file_path:
        raise HTTPException(
            status_code=404,
            detail="No resume found."
        )

    pdf_path = Path(file_path)

    if pdf_path.exists():
        try:
            pdf_path.unlink()
        except OSError:
            pass

    return {
        "success": True,
        "message": "Resume deleted successfully."
    }


@router.post("/upload")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are allowed.",
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5 MB.",
        )

    # Extract and structure the new resume before replacing the old one.
    try:
        extracted_text = extract_pdf_text(file_content)

        profile = structure_resume_with_gemini(extracted_text)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        )

    safe_filename = (
        f"user_{current_user['id']}_{uuid4().hex}.pdf"
    )
    file_path = UPLOAD_DIR / safe_filename

    try:
        file_path.write_bytes(file_content)

        resume_id = save_resume(
            user_id=current_user["id"],
            file_name=file.filename,
            file_path=str(file_path),
            file_size=len(file_content),
            content_type="application/pdf",
        )

        save_resume_profile(
            user_id=current_user["id"],
            resume_id=resume_id,
            extracted_text=extracted_text,
            profile=profile,
        )

        # Refresh Ask AI's private retrieval index after the resume is committed.
        background_tasks.add_task(
            _refresh_ask_ai_index, int(current_user["id"])
        )

        return {
            "success": True,
            "message": "Resume uploaded and analysed successfully.",
            "resume_id": resume_id,
            "file_name": file.filename,
            "profile": profile,
        }

    except Exception as error:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Resume upload or profile saving failed.",
        ) from error
