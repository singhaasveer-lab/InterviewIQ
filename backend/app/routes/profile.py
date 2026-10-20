from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.auth.security import get_current_user
from backend.app.database import get_db
from backend.app.models.aptitude import AptitudeAttempt
from backend.app.models.interview import Interview
from backend.app.models.profile import UserProfile
from backend.app.models.user import User

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileData(BaseModel):
    target_role: str = Field(default="", max_length=128)
    experience: str = Field(default="", max_length=64)
    interview_type: str = Field(default="", max_length=64)
    difficulty: str = Field(default="", max_length=64)
    question_count: Optional[int] = Field(default=None, ge=1, le=25)
    skills: List[str] = Field(default_factory=list, max_length=30)


def _to_dict(profile: Optional[UserProfile]) -> dict:
    if profile is None:
        return ProfileData().model_dump()
    return {
        "target_role": profile.target_role or "",
        "experience": profile.experience or "",
        "interview_type": profile.interview_type or "",
        "difficulty": profile.difficulty or "",
        "question_count": profile.question_count,
        "skills": profile.skills or [],
    }


@router.get("", response_model=ProfileData)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_dict(db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first())


@router.put("", response_model=ProfileData)
def save_profile(
    data: ProfileData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    profile.target_role = data.target_role.strip()
    profile.experience = data.experience.strip()
    profile.interview_type = data.interview_type.strip()
    profile.difficulty = data.difficulty.strip()
    profile.question_count = data.question_count
    profile.skills = [s.strip()[:60] for s in data.skills if s.strip()]

    db.commit()
    db.refresh(profile)
    return _to_dict(profile)


@router.delete("/practice-data")
def reset_practice_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete the user's interviews and aptitude attempts; the account stays."""
    interviews = db.query(Interview).filter(Interview.user_id == current_user.id).all()
    for interview in interviews:
        db.delete(interview)  # cascades to questions, answers and evaluation

    attempts = (
        db.query(AptitudeAttempt)
        .filter(AptitudeAttempt.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"success": True, "interviews_deleted": len(interviews), "aptitude_attempts_deleted": attempts}
