import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.auth.security import get_current_user
from backend.app.models.user import User
from backend.app.models.aptitude import AptitudeAttempt
from backend.app.models.interview import Interview
from backend.app.schemas.chat import CodingEvaluateRequest
from backend.app.ai.gemini_client import get_gemini_client

analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])

def _streak(dates, today):
    """Consecutive active days ending today (or yesterday, so the streak survives until midnight)."""
    days = set(dates)
    cursor = today if today in days else today - timedelta(days=1)
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _avg(values):
    values = [v for v in values if v is not None]
    return round(sum(values) / len(values)) if values else 0


@analytics_router.get("")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id, Interview.evaluation != None)
        .order_by(Interview.created_at)
        .all()
    )
    attempts = (
        db.query(AptitudeAttempt)
        .filter(AptitudeAttempt.user_id == current_user.id)
        .order_by(AptitudeAttempt.created_at)
        .all()
    )

    evals = [i.evaluation for i in interviews]

    score_history = [
        {
            "date": i.created_at.strftime("%b %d"),
            "score": i.evaluation.overall_score,
            "role": i.role,
            "type": i.interview_type,
        }
        for i in interviews[-8:]
    ]

    difficulty_stats = {}
    for level in ("easy", "medium", "hard"):
        group = [i for i in interviews if (i.difficulty or "").lower() == level]
        difficulty_stats[level] = {
            "count": len(group),
            "avgScore": _avg([i.evaluation.overall_score for i in group]),
        }

    # Topic mastery: average per-question score by topic across interviews,
    # plus topics missed in aptitude tests.
    topic_scores = {}
    for e in evals:
        for item in e.per_question_feedback or []:
            topic, score = item.get("topic"), item.get("score")
            if topic and isinstance(score, (int, float)):
                topic_scores.setdefault(topic, []).append(score)

    topic_avgs = {t: round(sum(v) / len(v)) for t, v in topic_scores.items()}
    strongest = [t for t, a in sorted(topic_avgs.items(), key=lambda kv: -kv[1]) if a >= 75][:5]

    weak_details = [
        {"topic": t, "score": a, "source": "interview"}
        for t, a in sorted(topic_avgs.items(), key=lambda kv: kv[1])
        if a < 70
    ][:5]

    aptitude_misses = {}
    for a in attempts[-10:]:
        for topic in json.loads(a.weak_topics or "[]"):
            aptitude_misses[topic] = aptitude_misses.get(topic, 0) + 1
    for topic, misses in sorted(aptitude_misses.items(), key=lambda kv: -kv[1])[:5]:
        weak_details.append({"topic": topic, "score": None, "source": "aptitude", "misses": misses})

    section_totals = {}
    for a in attempts:
        for name, s in json.loads(a.section_scores or "{}").items():
            agg = section_totals.setdefault(name, [0, 0])
            agg[0] += s.get("correct", 0)
            agg[1] += s.get("total", 0)

    active_days = [e.created_at.date() for e in evals if e.created_at] + [
        a.created_at.date() for a in attempts if a.created_at
    ]

    latest_recs = (evals[-1].recommendations or []) if evals else []

    return {
        "hasData": bool(interviews or attempts),
        "interviewsCompleted": len(interviews),
        "averageScore": _avg([e.overall_score for e in evals]),
        "questionsPracticed": sum(i.question_count for i in interviews) + sum(a.total_questions for a in attempts),
        "currentStreak": _streak(active_days, datetime.utcnow().date()),
        "scoreHistory": score_history,
        "categoryBreakdown": {
            "technical": _avg([e.technical_score for e in evals]),
            "behavioral": _avg([e.communication_score for e in evals]),
            "problemSolving": _avg([e.problem_solving_score for e in evals]),
            "confidence": _avg([e.confidence_score for e in evals]),
        },
        "difficultyStats": difficulty_stats,
        "strongestTopics": strongest,
        "weakestTopics": [d["topic"] for d in weak_details],
        "weakTopicDetails": weak_details,
        "aptitude": {
            "attempts": len(attempts),
            "averageScore": _avg([a.score for a in attempts]),
            "bySection": {
                name: round(c / t * 100) if t else 0 for name, (c, t) in section_totals.items()
            },
        },
        "latestRecommendation": latest_recs[0] if latest_recs else None,
    }


learning_router = APIRouter(prefix="/learning-path", tags=["learning"])

@learning_router.get("")
def get_learning_path(role: str = "Full Stack Engineer"):
    client = get_gemini_client()
    prompt = f"""You are a Principal Engineering Career Mentor.
Target Role: {role}
Generate a 7-day personalized interview preparation roadmap.
Return ONLY valid JSON matching:
{{
  "role": "{role}",
  "total_days": 7,
  "roadmap": [
    {{
      "day": 1,
      "title": "...",
      "goal": "...",
      "practice_task": "...",
      "resources": ["...", "..."],
      "sample_interview_question": "..."
    }}
  ]
}}"""
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config={"response_mime_type": "application/json", "temperature": 0.5}
    )
    try:
        return json.loads(response.text)
    except Exception:
        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)

coding_router = APIRouter(prefix="/coding", tags=["coding"])

@coding_router.post("/evaluate")
def evaluate_code(req: CodingEvaluateRequest):
    client = get_gemini_client()
    prompt = f"""You are a Staff Technical Interviewer evaluating code.
Problem: {req.title}
Problem Details:
{req.problem_statement}

Candidate Code ({req.language}):
```{req.language}
{req.code}
```

Return ONLY valid JSON:
{{
  "score": 92,
  "passed_all_tests": true,
  "time_complexity": "O(N)",
  "space_complexity": "O(1)",
  "code_quality": "Clean and idiomatic",
  "strengths": ["Optimal two-pointer approach"],
  "edge_cases_missed": ["Empty array handling"],
  "test_cases": [
    {{ "input": "...", "expected": "...", "passed": true }}
  ],
  "improved_solution": "// Refactored..."
}}"""
    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config={"response_mime_type": "application/json", "temperature": 0.2}
    )
    try:
        return json.loads(response.text)
    except Exception:
        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
