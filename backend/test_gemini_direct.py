
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parent / ".env", override=False)

api_key = os.getenv("Gemini_Askai_api", "").strip()

if not api_key:
    print("ERROR: Gemini_Askai_api was not found.")
    raise SystemExit(1)

print("API key found: Yes")
print("Testing Gemini 3.8 Flash using the Interactions API...")

try:
    client = genai.Client(api_key=api_key)

    response = client.interactions.create(
        model="gemini-3.5-flash-lite",
        input="Reply with exactly: Interactions API test successful.",
    )

    print("SUCCESS")
    print("Response:", response.output_text)

except Exception as error:
    print("FAILED")
    print("Error type:", type(error).__name__)
    print("Error details:", str(error)[:1000])
