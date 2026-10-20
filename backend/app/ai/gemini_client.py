from google import genai

from backend.app.config import settings


def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is missing.")

    return genai.Client(
        api_key=settings.GEMINI_API_KEY
    )