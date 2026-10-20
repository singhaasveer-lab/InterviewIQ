from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import Base, engine

# ============================================================
# ROUTERS
# ============================================================

from backend.app.routes.auth import router as auth_router
from backend.app.auth.security import get_current_user
from backend.app.auth.rate_limit import ai_rate_limit
from backend.app.routes.interview import router as interview_router
from backend.app.routes.chat import router as chat_router
from backend.app.routes.resume import router as resume_router
from backend.app.routes.job import router as job_router
from backend.app.routes.rag import router as rag_router
from backend.app.routes.aptitude import router as aptitude_router
from backend.app.routes.profile import router as profile_router
from backend.app.routes.analytics import (
    analytics_router,
    learning_router,
    coding_router,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "InterviewIQ: AI-Powered Mock Interview Platform API"
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================================
# CORS
# ============================================================

configured_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

# Ensure our known development origins are available.
development_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

for origin in development_origins:
    if origin not in configured_origins:
        configured_origins.append(origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

API_PREFIX = settings.API_V1_STR


app.include_router(
    auth_router,
    prefix=API_PREFIX,
)

app.include_router(
    interview_router,
    prefix=API_PREFIX,
)

app.include_router(
    chat_router,
    prefix=API_PREFIX,
    dependencies=[Depends(ai_rate_limit)],
)

app.include_router(
    resume_router,
    prefix=API_PREFIX,
    dependencies=[Depends(ai_rate_limit)],
)

app.include_router(
    job_router,
    prefix=API_PREFIX,
    dependencies=[Depends(ai_rate_limit)],
)

app.include_router(
    rag_router,
    prefix=API_PREFIX,
)

app.include_router(
    aptitude_router,
    prefix=API_PREFIX,
)

app.include_router(
    profile_router,
    prefix=API_PREFIX,
)

app.include_router(
    analytics_router,
    prefix=API_PREFIX,
)

app.include_router(
    learning_router,
    prefix=API_PREFIX,
    dependencies=[Depends(ai_rate_limit)],
)

app.include_router(
    coding_router,
    prefix=API_PREFIX,
    dependencies=[Depends(ai_rate_limit)],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "app": "InterviewIQ",
        "status": "operational",
        "version": "2.4.0",
        "docs": "/docs",
        "api": settings.API_V1_STR,
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "InterviewIQ",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }