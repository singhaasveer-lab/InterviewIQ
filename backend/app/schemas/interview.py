from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InterviewGenerateRequest(BaseModel):
    role: str = "Software Engineer"
    experience: str = "1-2 years"
    interview_type: str = "Mixed"
    difficulty: str = "Medium"
    question_count: int = Field(default=5, ge=1, le=25)
    skills: List[str] = Field(default_factory=list)
    job_description: Optional[str] = ""
    resume_context: Optional[str] = ""

class QuestionSchema(BaseModel):
    id: int
    type: str # 'mcq' or 'text'
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    topic: Optional[str] = "General"

class InterviewGenerateResponse(BaseModel):
    interview_id: str
    questions: List[QuestionSchema]
    total_questions: int
    role: str
    difficulty: str

class QuestionFeedbackSchema(BaseModel):
    questionId: int
    question: str
    userAnswer: str
    score: int
    feedback: str
    suggestedAnswer: str
    topic: str

class EvaluationResponse(BaseModel):
    overallScore: int
    technicalScore: int
    communicationScore: int
    problemSolvingScore: int
    confidenceScore: int
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    questionFeedback: List[QuestionFeedbackSchema]

class InterviewEvaluateRequest(BaseModel):
    interview_id: Optional[str] = None
    questions: List[Dict[str, Any]]
    answers: Dict[str, str]
    role: Optional[str] = "Software Engineer"
    skills: Optional[List[str]] = Field(default_factory=list)
    job_description: Optional[str] = ""
    resume_context: Optional[str] = ""
