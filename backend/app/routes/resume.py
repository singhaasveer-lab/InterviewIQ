import json
from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ResumeAnalyzeRequest, ResumeAnalyzeResponse
from backend.app.ai.gemini_client import get_gemini_client

router = APIRouter(prefix="/resume", tags=["resume"])

@router.post("/analyze", response_model=ResumeAnalyzeResponse)
def analyze_resume(req: ResumeAnalyzeRequest):
    if len(req.resume_text.strip()) < 10:
        raise HTTPException(status_code=422, detail="Resume content is too short.")

    client = get_gemini_client()
    prompt = f"""You are a Senior Recruiter and ATS Specialist at InterviewIQ.
Target Role: {req.target_role}
Resume:
{req.resume_text[:4000]}

Analyze ATS score, resume score, extracted skills, missing skills, strengths, weaknesses, improvements, and 5 tailored interview questions.

Return ONLY valid JSON matching this schema:
{{
  "ats_score": 85,
  "resume_score": 88,
  "skills": ["TypeScript", "React"],
  "missing_skills": ["Docker", "Kubernetes"],
  "strengths": ["Clear impact metrics"],
  "weaknesses": ["Could add scale numbers"],
  "improvements": ["Highlight CI/CD pipeline automation"],
  "tailored_interview_questions": ["How did you optimize React rendering?"]
}}"""

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config={"response_mime_type": "application/json", "temperature": 0.4}
    )

    try:
        return json.loads(response.text)
    except Exception:
        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
