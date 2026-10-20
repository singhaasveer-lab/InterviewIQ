import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.auth.security import get_current_user
from backend.app.models.user import User
from backend.app.models.aptitude import AptitudeAttempt
from backend.app.schemas.aptitude import (
    APTITUDE_SECTIONS,
    AptitudeGenerateRequest,
    AptitudeGenerateResponse,
    AptitudeAttemptCreate,
    AptitudeAttemptResponse,
)
from backend.app.auth.rate_limit import consume_ai_quota
from backend.app.services.ai_service import AIService
from backend.app.services.aptitude_bank import generate_bank_questions

router = APIRouter(prefix="/aptitude", tags=["aptitude"])


def _to_response(attempt: AptitudeAttempt) -> dict:
    return {
        "id": attempt.id,
        "difficulty": attempt.difficulty,
        "total_questions": attempt.total_questions,
        "correct_count": attempt.correct_count,
        "score": attempt.score,
        "time_taken_seconds": attempt.time_taken_seconds or 0,
        "section_scores": json.loads(attempt.section_scores or "{}"),
        "weak_topics": json.loads(attempt.weak_topics or "[]"),
        "created_at": attempt.created_at.isoformat(),
    }


@router.post("/generate", response_model=AptitudeGenerateResponse)
async def generate_aptitude(
    req: AptitudeGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    sections = [s for s in dict.fromkeys(req.sections) if s in APTITUDE_SECTIONS]
    if not sections:
        raise HTTPException(
            status_code=422,
            detail=f"Choose at least one section from: {', '.join(APTITUDE_SECTIONS)}.",
        )

    focus = [t.strip()[:80] for t in req.focus_topics if t.strip()]

    if req.source == "instant":
        questions = generate_bank_questions(sections, req.difficulty, req.question_count, focus)
    else:
        consume_ai_quota(current_user)
        try:
            questions = await AIService.generate_aptitude_questions(
                sections=sections,
                difficulty=req.difficulty,
                question_count=req.question_count,
                focus_topics=focus,
            )
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"Could not generate aptitude questions: {error}",
            )

    return {
        "questions": questions,
        "total_questions": len(questions),
        "difficulty": req.difficulty,
        "source": req.source,
    }


@router.post("/attempts", response_model=AptitudeAttemptResponse)
def save_attempt(
    req: AptitudeAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.correct_count > req.total_questions:
        raise HTTPException(status_code=422, detail="correct_count cannot exceed total_questions.")

    attempt = AptitudeAttempt(
        user_id=current_user.id,
        difficulty=req.difficulty,
        total_questions=req.total_questions,
        correct_count=req.correct_count,
        score=round(req.correct_count / req.total_questions * 100),
        time_taken_seconds=req.time_taken_seconds,
        section_scores=json.dumps({k: v.model_dump() for k, v in req.section_scores.items()}),
        weak_topics=json.dumps(req.weak_topics),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return _to_response(attempt)


@router.get("/attempts", response_model=List[AptitudeAttemptResponse])
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(AptitudeAttempt)
        .filter(AptitudeAttempt.user_id == current_user.id)
        .order_by(AptitudeAttempt.created_at.desc())
        .limit(20)
        .all()
    )
    return [_to_response(a) for a in attempts]
