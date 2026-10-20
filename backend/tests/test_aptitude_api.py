import json

from backend.app.config import settings


def _ai_question(section, i, **overrides):
    q = {
        "section": section,
        "topic": f"Topic{i}",
        "question": f"{section} question {i}?",
        "options": ["1", "2", "3", "4"],
        "correct_answer": "3",
        "explanation": "because",
        "shortcut": "",
    }
    q.update(overrides)
    return q


def test_instant_generation_needs_no_ai(client, make_user):
    _, h = make_user()
    res = client.post("/api/aptitude/generate", headers=h, json={"question_count": 9, "source": "instant"})
    assert res.status_code == 200
    body = res.json()
    assert body["total_questions"] == 9
    assert body["source"] == "instant"
    for q in body["questions"]:
        assert len(set(q["options"])) == 4
        assert 0 <= q["correct_index"] < 4
        assert q["explanation"]


def test_unknown_section_is_rejected(client, make_user):
    _, h = make_user()
    res = client.post("/api/aptitude/generate", headers=h, json={"sections": ["Bogus"]})
    assert res.status_code == 422


def test_ai_generation_filters_invalid_questions_and_shuffles(client, make_user, fake_gemini):
    _, h = make_user()
    fake_gemini(
        json.dumps(
            {
                "questions": [
                    _ai_question("Quantitative", 1),
                    _ai_question("Quantitative", 2),
                    _ai_question("Quantitative", 3),
                    _ai_question("Logical", 1),
                    _ai_question("Logical", 2, correct_answer="9"),  # key not among options
                    _ai_question("Logical", 3, options=["1", "1", "2", "3"]),  # duplicate options
                    _ai_question("Logical", 4),
                    _ai_question("Quantitative", 1),  # duplicate question text
                ]
            }
        )
    )
    res = client.post(
        "/api/aptitude/generate",
        headers=h,
        json={"sections": ["Quantitative", "Logical"], "question_count": 4, "source": "ai"},
    )
    assert res.status_code == 200
    qs = res.json()["questions"]
    assert [q["section"] for q in qs] == ["Quantitative", "Quantitative", "Logical", "Logical"]
    assert [q["id"] for q in qs] == [1, 2, 3, 4]
    # whatever the shuffle did, the index must still point at the right answer
    assert all(q["options"][q["correct_index"]] == "3" for q in qs)


def test_ai_prompt_includes_focus_topics(client, make_user, fake_gemini):
    _, h = make_user()
    prompts = fake_gemini(json.dumps({"questions": [_ai_question("Quantitative", 1)]}))
    client.post(
        "/api/aptitude/generate",
        headers=h,
        json={"sections": ["Quantitative"], "question_count": 3, "source": "ai", "focus_topics": ["Probability"]},
    )
    assert prompts and "Probability" in prompts[0]


def test_ai_generation_is_rate_limited_but_instant_is_not(client, make_user, fake_gemini, monkeypatch):
    monkeypatch.setattr(settings, "AI_BURST_PER_MINUTE", 2)
    _, h = make_user()
    fake_gemini(json.dumps({"questions": [_ai_question("Quantitative", 1)]}))
    body = {"sections": ["Quantitative"], "question_count": 3, "source": "ai"}

    assert client.post("/api/aptitude/generate", headers=h, json=body).status_code == 200
    assert client.post("/api/aptitude/generate", headers=h, json=body).status_code == 200
    assert client.post("/api/aptitude/generate", headers=h, json=body).status_code == 429

    # instant tests never count against the AI quota
    for _ in range(5):
        res = client.post("/api/aptitude/generate", headers=h, json={"question_count": 3, "source": "instant"})
        assert res.status_code == 200

    # and another user is unaffected
    _, other = make_user()
    assert client.post("/api/aptitude/generate", headers=other, json=body).status_code == 200


def test_attempts_save_list_and_isolation(client, make_user):
    _, a = make_user()
    _, b = make_user()
    payload = {
        "difficulty": "Easy",
        "total_questions": 4,
        "correct_count": 3,
        "time_taken_seconds": 50,
        "section_scores": {"Quantitative": {"correct": 2, "total": 2}, "Logical": {"correct": 1, "total": 2}},
        "weak_topics": ["T1"],
    }
    saved = client.post("/api/aptitude/attempts", headers=a, json=payload)
    assert saved.status_code == 200
    assert saved.json()["score"] == 75

    listed = client.get("/api/aptitude/attempts", headers=a).json()
    assert len(listed) == 1 and listed[0]["section_scores"]["Logical"]["correct"] == 1
    assert client.get("/api/aptitude/attempts", headers=b).json() == []


def test_attempt_validation(client, make_user):
    _, h = make_user()
    bad = {"difficulty": "Easy", "total_questions": 2, "correct_count": 3, "section_scores": {}}
    assert client.post("/api/aptitude/attempts", headers=h, json=bad).status_code == 422
