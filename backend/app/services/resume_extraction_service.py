import json
import os

import time

import httpx
from pypdf import PdfReader
from io import BytesIO


GEMINI_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract readable text from an uploaded PDF."""

    try:
        reader = PdfReader(BytesIO(pdf_bytes))

        if reader.is_encrypted:
            raise ValueError(
                "Password-protected PDFs are not supported."
            )

        pages = []

        for page in reader.pages:
            text = page.extract_text() or ""

            if text.strip():
                pages.append(text.strip())

        extracted_text = "\n\n".join(pages).strip()

        if not extracted_text:
            raise ValueError(
                "No readable text was found in this PDF. "
                "It may be a scanned document."
            )

        return extracted_text[:60000]

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            "Unable to read this PDF. Please upload a valid PDF."
        ) from error



def structure_resume_with_gemini(extracted_text: str) -> dict:
    """Extract structured resume information with bounded retries."""

    api_key = os.getenv("GEMINI_RESUME_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GEMINI_RESUME_API_KEY is missing from backend .env."
        )

    model_name = os.getenv(
        "GEMINI_RESUME_MODEL", "gemini-3.5-flash-lite"
    ).strip()

    prompt = f"""
Extract only information explicitly supported by this resume.
Do not invent skills, qualifications, dates, or achievements.
Use empty arrays when information is unavailable.

Return valid JSON with exactly these fields:
{{
  "skills": ["skill names"],
  "projects": [
    {{"name": "", "description": "", "technologies": []}}
  ],
  "education": [
    {{"qualification": "", "institution": "", "year": ""}}
  ],
  "experience": [
    {{"title": "", "organization": "", "description": ""}}
  ],
  "certifications": ["certification names"]
}}

RESUME TEXT:
{extracted_text}
"""

    url = f"{GEMINI_BASE_URL}/{model_name}:generateContent"
    retryable_statuses = {500, 502, 503, 504}
    last_error = None

    try:
        with httpx.Client(timeout=60.0) as client:
            for attempt in range(4):
                try:
                    response = client.post(
                        url,
                        headers={
                            "x-goog-api-key": api_key,
                            "Content-Type": "application/json",
                        },
                        json={
                            "contents": [
                                {"parts": [{"text": prompt}]}
                            ],
                            "generationConfig": {
                                "responseMimeType": "application/json",
                                "temperature": 0.1,
                            },
                        },
                    )

                    if response.status_code in retryable_statuses:
                        details = response.text[:500]
                        last_error = (
                            f"Gemini HTTP {response.status_code}: {details}"
                        )

                        if attempt < 3:
                            time.sleep(2 ** attempt)
                            continue

                        raise RuntimeError(
                            "Gemini remained unavailable after 4 attempts. "
                            + last_error
                        )

                    if response.status_code >= 400:
                        raise RuntimeError(
                            f"Gemini returned HTTP {response.status_code}: "
                            f"{response.text[:500]}"
                        )

                    payload = response.json()
                    result_text = (
                        payload["candidates"][0]["content"]["parts"][0]["text"]
                    )
                    data = json.loads(result_text)

                    fields = [
                        "skills", "projects", "education",
                        "experience", "certifications",
                    ]
                    for field in fields:
                        if not isinstance(data.get(field), list):
                            data[field] = []

                    return data

                except httpx.HTTPError as error:
                    last_error = str(error)

                    if attempt < 3:
                        time.sleep(2 ** attempt)
                        continue

                    raise RuntimeError(
                        "Gemini could not be reached after 4 attempts. "
                        f"Details: {last_error[:300]}"
                    ) from error

    except RuntimeError:
        raise
    except (KeyError, IndexError, ValueError) as error:
        raise RuntimeError(
            "Gemini responded, but its resume result was not valid JSON. "
            "Please retry."
        ) from error

    raise RuntimeError(
        "Gemini resume extraction failed. "
        f"{last_error or 'Unknown error.'}"
    )
