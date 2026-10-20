from pydantic import BaseModel
from typing import List, Optional

class ChatHistoryItem(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = None

class ChatResponse(BaseModel):
    reply: str
    timestamp: str

class ResumeAnalyzeRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = "Software Engineer"

class ResumeAnalyzeResponse(BaseModel):
    ats_score: int
    resume_score: int
    skills: List[str]
    missing_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    improvements: List[str]
    tailored_interview_questions: List[str]

class JobAnalyzeRequest(BaseModel):
    job_description: str
    resume_text: Optional[str] = ""

class JobAnalyzeResponse(BaseModel):
    role_title: str
    seniority: str
    match_percentage: int
    required_skills: List[str]
    preferred_skills: List[str]
    core_responsibilities: List[str]
    missing_skills: List[str]
    strong_matches: List[str]
    interview_topics: List[str]
    prep_roadmap: List[str]

class RAGUploadRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "study_notes"

class RAGSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 4

class CodingEvaluateRequest(BaseModel):
    problem_id: str
    title: str
    language: str
    code: str
    problem_statement: str
