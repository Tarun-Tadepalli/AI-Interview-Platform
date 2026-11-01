
from pathlib import Path
from uuid import uuid4
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    BackgroundTasks,
)
from fastapi.responses import FileResponse, Response

from app.models.resume_model import (
    get_resume_by_user_id,
    save_resume,
    delete_resume_by_user_id,
    save_resume_profile,
)
from app.utils.auth_dependency_util import get_current_user

from app.services.resume_extraction_service import (
    extract_pdf_text,
    structure_resume_with_gemini,
)

from app.services.supabase_storage_service import (
    upload_resume_to_supabase,
    download_resume_from_supabase,
    delete_resume_from_supabase,
)


router = APIRouter(
    prefix="/resume",
    tags=["Resume"],
)


BASE_DIR = Path(__file__).resolve().parents[2]
MAX_FILE_SIZE = 5 * 1024 * 1024


def _refresh_ask_ai_index(user_id: int):
    from app.services.ask_ai_index_refresh import refresh_user_index
    refresh_user_index(user_id)


def _is_supabase_path(file_path: str) -> bool:
    """
    New cloud resume paths use the format:
    users/<user_id>/<filename>.pdf

    Old resumes may still have local Windows/Linux file paths.
    """
    return file_path.replace("\\", "/").startswith("users/")


def _delete_old_resume_file(file_path: str):
    """
    Delete an old resume only after the replacement has been saved.
    Supports both Supabase objects and old local files.
    """
    if not file_path:
        return

    try:
        if _is_supabase_path(file_path):
            delete_resume_from_supabase(file_path)
        else:
            old_path = Path(file_path)
            if old_path.exists():
                old_path.unlink()
    except Exception:
        # The database already points to the new resume.
        # A failed old-file deletion should not undo a successful upload.
        pass


@router.get("/me")
async def get_my_resume(
    current_user=Depends(get_current_user),
):
    resume = get_resume_by_user_id(current_user["id"])

    if not resume:
        return {
            "success": True,
            "resume": None,
        }

    return {
        "success": True,
        "resume": {
            "id": resume["id"],
            "file_name": resume["file_name"],
            "file_size": resume["file_size"],
            "content_type": resume["content_type"],
            "uploaded_at": resume["uploaded_at"],
        },
    }


@router.get("/view")
async def view_my_resume(
    current_user=Depends(get_current_user),
):
    resume = get_resume_by_user_id(current_user["id"])

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found.",
        )

    file_path = resume["file_path"]

    if not file_path:
        raise HTTPException(
            status_code=404,
            detail="Resume file path not found.",
        )

    # New resumes are stored in the private Supabase bucket.
    if _is_supabase_path(file_path):
        try:
            file_content = download_resume_from_supabase(file_path)
        except RuntimeError as error:
            raise HTTPException(
                status_code=502,
                detail="Unable to retrieve resume from cloud storage.",
            ) from error

        return Response(
            content=file_content,
            media_type=resume["content_type"] or "application/pdf",
            headers={
                "Content-Disposition": (
                    f'inline; filename="{quote(resume["file_name"])}"'
                )
            },
        )

    # Backward compatibility for resumes stored locally before migration.
    local_path = Path(file_path)

    if not local_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found.",
        )

    return FileResponse(
        path=local_path,
        media_type=resume["content_type"] or "application/pdf",
        filename=resume["file_name"],
        content_disposition_type="inline",
    )


@router.delete("/me")
async def delete_my_resume(
    current_user=Depends(get_current_user),
):
    resume = get_resume_by_user_id(current_user["id"])

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found.",
        )

    file_path = resume["file_path"]

    # Remove the database record first. If storage cleanup fails,
    # the user will not be left with a database record pointing to
    # a missing PDF.
    deleted_path = delete_resume_by_user_id(current_user["id"])

    if not deleted_path:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete resume record.",
        )

    try:
        if _is_supabase_path(file_path):
            delete_resume_from_supabase(file_path)
        else:
            local_path = Path(file_path)
            if local_path.exists():
                local_path.unlink()
    except Exception:
        # The database record is deleted. A leftover cloud object,
        # if any, can be cleaned up separately.
        pass

    return {
        "success": True,
        "message": "Resume deleted successfully.",
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

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Resume must be smaller than 5 MB.",
        )

    # Extract and analyse the new resume before replacing the old one.
    # If Gemini extraction fails, the existing resume remains untouched.
    try:
        extracted_text = extract_pdf_text(file_content)
        profile = structure_resume_with_gemini(extracted_text)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    old_resume = get_resume_by_user_id(current_user["id"])

    # Store each user's PDF in a separate folder in the private bucket.
    object_path = (
        f"users/{current_user['id']}/{uuid4().hex}.pdf"
    )

    # Upload the PDF to Supabase before changing the database record.
    try:
        upload_resume_to_supabase(
            file_path=object_path,
            file_content=file_content,
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail="Resume could not be uploaded to cloud storage.",
        ) from error

    try:
        resume_id = save_resume(
            user_id=current_user["id"],
            file_name=file.filename,
            file_path=object_path,
            file_size=len(file_content),
            content_type="application/pdf",
        )

        save_resume_profile(
            user_id=current_user["id"],
            resume_id=resume_id,
            extracted_text=extracted_text,
            profile=profile,
        )

    except Exception as error:
        # Do not delete the uploaded object here: save_resume() and
        # save_resume_profile() use separate database operations.
        # Keeping the object avoids accidentally leaving a committed
        # database record pointing to a deleted PDF.
        raise HTTPException(
            status_code=500,
            detail="Resume was uploaded, but saving its database profile failed. Please check the backend logs.",
        ) from error

    # The new resume and profile have been saved. Now clean up the old PDF.
    if old_resume and old_resume.get("file_path"):
        _delete_old_resume_file(old_resume["file_path"])

    # Refresh Ask AI's resume-based retrieval index in the background.
    background_tasks.add_task(
        _refresh_ask_ai_index,
        int(current_user["id"]),
    )

    return {
        "success": True,
        "message": "Resume uploaded and analysed successfully.",
        "resume_id": resume_id,
        "file_name": file.filename,
        "profile": profile,
    }
