
from pathlib import Path
import time

from dotenv import load_dotenv

# Load the backend environment variables.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

from app.database.connection import get_db_connection
from app.services.resume_extraction_service import (
    extract_pdf_text,
    structure_resume_with_gemini,
)
from app.models.resume_model import save_resume_profile


def main():
    # Find resumes that do not have an extracted profile.
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT r.user_id, r.id, r.file_name, r.file_path
                FROM resumes r
                LEFT JOIN resume_profiles rp
                    ON rp.user_id = r.user_id
                WHERE rp.user_id IS NULL
                ORDER BY r.user_id
                """
            )
            missing_resumes = cursor.fetchall()
    finally:
        connection.close()

    if not missing_resumes:
        print("All saved resumes already have extracted profiles.")
        return

    print(f"Found {len(missing_resumes)} resumes to process.")

    for user_id, resume_id, file_name, file_path in missing_resumes:
        pdf_path = Path(file_path)

        print(f"\nUser ID: {user_id}")
        print(f"Resume ID: {resume_id}")
        print(f"File: {file_name}")

        if not pdf_path.is_file():
            print(f"SKIPPED: PDF file not found: {pdf_path}")
            continue

        try:
            pdf_bytes = pdf_path.read_bytes()
            extracted_text = extract_pdf_text(pdf_bytes)

            # Gemini extraction; your service handles retries.
            profile = structure_resume_with_gemini(extracted_text)

            save_resume_profile(
                user_id=user_id,
                resume_id=resume_id,
                extracted_text=extracted_text,
                profile=profile,
            )

            print("SUCCESS: Extracted profile saved.")

        except Exception as error:
            print(f"FAILED: {type(error).__name__}: {error}")

        # Avoid sending requests back-to-back unnecessarily.
        time.sleep(1)

    print("\nBackfill finished. Check the database results.")


if __name__ == "__main__":
    main()
