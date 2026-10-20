import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(64), primary_key=True, default=lambda: f"int-{uuid.uuid4().hex[:12]}")
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    role = Column(String(128), nullable=False)
    experience = Column(String(64), nullable=False)
    interview_type = Column(String(64), nullable=False)
    difficulty = Column(String(64), nullable=False)
    question_count = Column(Integer, nullable=False)
    skills = Column(JSON, default=list)
    job_description = Column(Text, nullable=True)
    resume_context = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="interview", uselist=False, cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(64), primary_key=True, default=lambda: f"q-{uuid.uuid4().hex[:12]}")
    interview_id = Column(String(64), ForeignKey("interviews.id"), nullable=False)
    index = Column(Integer, nullable=False)
    question_type = Column(String(32), default="text") # 'mcq' or 'text'
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True) # list of 4 options for mcq
    correct_answer = Column(String(256), nullable=True)
    topic = Column(String(128), default="General")

    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False, cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(64), primary_key=True, default=lambda: f"ans-{uuid.uuid4().hex[:12]}")
    question_id = Column(String(64), ForeignKey("questions.id"), nullable=False)
    candidate_answer = Column(Text, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="answer")

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(64), primary_key=True, default=lambda: f"eval-{uuid.uuid4().hex[:12]}")
    interview_id = Column(String(64), ForeignKey("interviews.id"), nullable=False)
    overall_score = Column(Integer, nullable=False)
    technical_score = Column(Integer, nullable=False)
    communication_score = Column(Integer, nullable=False)
    problem_solving_score = Column(Integer, nullable=False)
    confidence_score = Column(Integer, nullable=False)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    per_question_feedback = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="evaluation")
