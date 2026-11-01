
import os
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv(
    "SUPABASE_STORAGE_BUCKET",
    "resumes"
)


def _get_headers():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "Supabase storage credentials are not configured."
        )

    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }


def _get_object_url(file_path: str) -> str:
    encoded_path = quote(file_path, safe="/")

    encoded_bucket = quote(
        SUPABASE_STORAGE_BUCKET,
        safe=""
    )

    return (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{encoded_bucket}/{encoded_path}"
    )


def upload_resume_to_supabase(
    file_path: str,
    file_content: bytes
):
    """
    Upload a resume PDF to the private Supabase bucket.
    """

    url = _get_object_url(file_path)

    headers = _get_headers()

    headers.update({
        "Content-Type": "application/pdf",
        "x-upsert": "false",
    })

    try:
        response = httpx.post(
            url,
            headers=headers,
            content=file_content,
            timeout=60.0
        )

        response.raise_for_status()

        return True

    except httpx.HTTPError as error:
        raise RuntimeError(
            f"Supabase resume upload failed: {error}"
        ) from error


def download_resume_from_supabase(file_path: str) -> bytes:
    """
    Download a resume from the private Supabase bucket.
    """

    url = (
        f"{SUPABASE_URL}/storage/v1/object/authenticated/"
        f"{quote(SUPABASE_STORAGE_BUCKET, safe='')}/"
        f"{quote(file_path, safe='/')}"
    )

    try:
        response = httpx.get(
            url,
            headers=_get_headers(),
            timeout=60.0
        )

        response.raise_for_status()

        return response.content

    except httpx.HTTPError as error:
        raise RuntimeError(
            f"Supabase resume download failed: {error}"
        ) from error



def delete_resume_from_supabase(file_path: str):
    encoded_bucket = quote(SUPABASE_STORAGE_BUCKET, safe="")
    url = f"{SUPABASE_URL}/storage/v1/object/{encoded_bucket}"

    try:
        response = httpx.request(
            "DELETE",
            url,
            headers=_get_headers(),
            json={"prefixes": [file_path]},
            timeout=60.0,
        )

        response.raise_for_status()
        return True

    except httpx.HTTPError as error:
        raise RuntimeError(
            f"Supabase resume deletion failed: {error}"
        ) from error
