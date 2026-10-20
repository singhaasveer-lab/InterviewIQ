from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

APTITUDE_SECTIONS = ["Quantitative", "Logical", "Verbal"]


class AptitudeGenerateRequest(BaseModel):
    sections: List[str] = Field(default_factory=lambda: list(APTITUDE_SECTIONS), min_length=1)
    difficulty: str = "Medium"
    question_count: int = Field(default=10, ge=3, le=30)
    # 'instant' = built-in question bank (no AI, no wait); 'ai' = Gemini-written
    source: Literal["instant", "ai"] = "instant"
    focus_topics: List[str] = Field(default_factory=list, max_length=10)


class AptitudeQuestion(BaseModel):
    id: int
    section: str
    topic: str
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    shortcut: Optional[str] = ""


class AptitudeGenerateResponse(BaseModel):
    questions: List[AptitudeQuestion]
    total_questions: int
    difficulty: str
    source: str = "instant"


class SectionScore(BaseModel):
    correct: int = Field(ge=0)
    total: int = Field(ge=0)


class AptitudeAttemptCreate(BaseModel):
    difficulty: str
    total_questions: int = Field(ge=1, le=100)
    correct_count: int = Field(ge=0)
    time_taken_seconds: int = Field(default=0, ge=0)
    section_scores: Dict[str, SectionScore]
    weak_topics: List[str] = Field(default_factory=list, max_length=50)


class AptitudeAttemptResponse(BaseModel):
    id: str
    difficulty: str
    total_questions: int
    correct_count: int
    score: int
    time_taken_seconds: int
    section_scores: Dict[str, SectionScore]
    weak_topics: List[str]
    created_at: str
