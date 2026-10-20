import json
from datetime import datetime, timedelta

from backend.app.database import SessionLocal
from backend.app.models.aptitude import AptitudeAttempt
from backend.app.models.interview import Evaluation, Interview


def _seed(user_id):
    """Two evaluated interviews (yesterday, today) and one aptitude attempt (today)."""
    now = datetime.utcnow()
    db = SessionLocal()
    try:
        for i, (score, difficulty) in enumerate([(60, "Easy"), (80, "Medium")]):
            when = now - timedelta(days=1 - i)
            interview = Interview(
                user_id=user_id, role="Dev", experience="1-2 years", interview_type="Mixed",
                difficulty=difficulty, question_count=5, skills=[], created_at=when,
            )
            db.add(interview)
            db.flush()
            db.add(
                Evaluation(
                    interview_id=interview.id, overall_score=score, technical_score=score,
                    communication_score=70, problem_solving_score=50, confidence_score=90,
                    strengths=[], weaknesses=[],
                    recommendations=["Use the STAR format"] if i == 1 else [],
                    per_question_feedback=[{"topic": "SQL", "score": 40}, {"topic": "React", "score": 90}],
                    created_at=when,
                )
            )
        db.add(
            AptitudeAttempt(
                user_id=user_id, difficulty="Easy", total_questions=10, correct_count=5, score=50,
                section_scores=json.dumps({"Quantitative": {"correct": 2, "total": 5}, "Verbal": {"correct": 3, "total": 5}}),
                weak_topics=json.dumps(["Percentages"]), created_at=now,
            )
        )
        db.commit()
    finally:
        db.close()


def test_new_account_has_no_fake_data(client, make_user):
    _, h = make_user()
    data = client.get("/api/analytics", headers=h).json()
    assert data["hasData"] is False
    assert data["interviewsCompleted"] == 0
    assert data["currentStreak"] == 0
    assert data["scoreHistory"] == []
    assert data["weakestTopics"] == [] and data["strongestTopics"] == []


def test_analytics_are_calculated_from_real_data(client, make_user):
    uid, h = make_user()
    _seed(uid)
    data = client.get("/api/analytics", headers=h).json()

    assert data["hasData"] is True
    assert data["interviewsCompleted"] == 2
    assert data["averageScore"] == 70
    assert data["categoryBreakdown"] == {"technical": 70, "behavioral": 70, "problemSolving": 50, "confidence": 90}
    assert data["difficultyStats"]["easy"] == {"count": 1, "avgScore": 60}
    assert data["difficultyStats"]["hard"]["count"] == 0
    assert data["currentStreak"] == 2
    assert data["questionsPracticed"] == 20
    assert data["strongestTopics"] == ["React"]
    assert [(d["topic"], d["source"]) for d in data["weakTopicDetails"]] == [
        ("SQL", "interview"),
        ("Percentages", "aptitude"),
    ]
    assert data["aptitude"]["bySection"] == {"Quantitative": 40, "Verbal": 60}
    assert data["latestRecommendation"] == "Use the STAR format"


def test_analytics_are_private_per_user(client, make_user):
    uid, a = make_user()
    _, b = make_user()
    _seed(uid)
    assert client.get("/api/analytics", headers=a).json()["hasData"] is True
    assert client.get("/api/analytics", headers=b).json()["hasData"] is False


def test_profile_roundtrip_and_validation(client, make_user):
    _, a = make_user()
    _, b = make_user()
    assert client.get("/api/profile", headers=a).json()["skills"] == []

    body = {
        "target_role": "Backend Developer", "experience": "3-5 years", "interview_type": "Technical",
        "difficulty": "Hard", "question_count": 10, "skills": ["Python", " SQL ", ""],
    }
    saved = client.put("/api/profile", headers=a, json=body).json()
    assert saved["skills"] == ["Python", "SQL"]
    assert client.get("/api/profile", headers=a).json()["question_count"] == 10
    assert client.get("/api/profile", headers=b).json()["target_role"] == ""
    assert client.put("/api/profile", headers=a, json=dict(body, question_count=99)).status_code == 422


def test_reset_practice_data_keeps_account_and_profile(client, make_user):
    uid, h = make_user()
    _seed(uid)
    client.put("/api/profile", headers=h, json={"target_role": "Data Engineer"})

    res = client.delete("/api/profile/practice-data", headers=h).json()
    assert res["interviews_deleted"] == 2 and res["aptitude_attempts_deleted"] == 1
    assert client.get("/api/analytics", headers=h).json()["hasData"] is False
    assert client.get("/api/profile", headers=h).json()["target_role"] == "Data Engineer"
    assert client.get("/api/auth/me", headers=h).status_code == 200
