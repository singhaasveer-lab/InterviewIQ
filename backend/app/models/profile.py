from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from backend.app.database import Base


class UserProfile(Base):
    """Saved interview preferences, used to prefill the interview setup screen."""

    __tablename__ = "user_profiles"

    user_id = Column(String(64), ForeignKey("users.id"), primary_key=True)
    target_role = Column(String(128), default="")
    experience = Column(String(64), default="")
    interview_type = Column(String(64), default="")
    difficulty = Column(String(64), default="")
    question_count = Column(Integer, nullable=True)
    skills = Column(JSON, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
