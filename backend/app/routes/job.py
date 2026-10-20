import json
from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import JobAnalyzeRequest, JobAnalyzeResponse
from backend.app.ai.gemini_client import get_gemini_client

router = APIRouter(prefix="/job", tags=["job"])

@router.post("/analyze", response_model=JobAnalyzeResponse)
def analyze_job(req: JobAnalyzeRequest):
    if len(req.job_description.strip()) < 10:
        raise HTTPException(status_code=422, detail="Job description is too short.")

    client = get_gemini_client()
    prompt = f"""You are a Hiring Architect at InterviewIQ.
Target Job Description:
{req.job_description[:3500]}

Candidate Resume Context:
{req.resume_text[:2000] if req.resume_text else 'None provided'}

Extract role_title, seniority, match_percentage, required_skills, preferred_skills, core_responsibilities, missing_skills, strong_matches, interview_topics, and prep_roadmap.

Return ONLY valid JSON:
{{
  "role_title": "Senior Frontend Engineer",
  "seniority": "Senior",
  "match_percentage": 82,
  "required_skills": ["React", "TypeScript"],
  "preferred_skills": ["GraphQL", "Docker"],
  "core_responsibilities": ["Lead performance architecture"],
  "missing_skills": ["GraphQL"],
  "strong_matches": ["React", "TypeScript"],
  "interview_topics": ["Rendering", "State Management"],
  "prep_roadmap": ["Deep dive into React 19 hooks"]
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
