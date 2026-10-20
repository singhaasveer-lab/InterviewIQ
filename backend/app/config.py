import secrets
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env files relative to the project, not the shell's working directory.
# Later files win, so backend/.env overrides the root .env.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
_ENV_FILES = (str(_BACKEND_DIR.parent / ".env"), str(_BACKEND_DIR / ".env"))


class Settings(BaseSettings):
    PROJECT_NAME: str = "InterviewIQ"
    API_V1_STR: str = "/api"

    GEMINI_API_KEY: str = ""

    DATABASE_URL: str = "sqlite:///./interviewiq.db"

    # Set a long random value in backend/.env. If it is missing, a random one is
    # generated at startup (sessions then end whenever the server restarts).
    JWT_SECRET: str = ""

    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:3000"
    )

    # Per-user limits on endpoints that call Gemini
    AI_DAILY_LIMIT: int = 150
    AI_BURST_PER_MINUTE: int = 12

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

if not settings.JWT_SECRET:
    settings.JWT_SECRET = secrets.token_urlsafe(48)
    print(
        "WARNING: JWT_SECRET is not set. Using a temporary random secret; "
        "everyone will be signed out when the server restarts."
    )