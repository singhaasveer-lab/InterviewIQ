import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class AptitudeAttempt(Base):
    __tablename__ = "aptitude_attempts"

    id = Column(String(64), primary_key=True, default=lambda: f"apt-{uuid.uuid4().hex[:12]}")
    user_id = Column(String(64), ForeignKey("users.id"), index=True, nullable=False)
    difficulty = Column(String(32), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_count = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)  # percentage 0-100
    time_taken_seconds = Column(Integer, default=0)
    # JSON string: {"Quantitative": {"correct": 3, "total": 5}, ...}
    section_scores = Column(Text, nullable=False, default="{}")
    # JSON string: topics answered wrong, used for "what to study"
    weak_topics = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
