import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.ai.gemini_client import get_gemini_client

router = APIRouter(prefix="", tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_coach(req: ChatRequest):
    client = get_gemini_client()
    history_lines = [f"{h.sender}: {h.text}" for h in (req.history or [])]
    prompt = f"""You are the InterviewIQ AI Master Career Coach.
Conversation History:
{chr(10).join(history_lines)}

Candidate's Latest Message:
"{req.message}"

Provide encouraging, calibrated, and actionable career and technical interview advice."""

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config={"temperature": 0.7}
    )

    return {
        "reply": response.text or "I'm ready to help you prepare. What topic would you like to explore?",
        "timestamp": datetime.utcnow().isoformat()
    }
