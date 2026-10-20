"""Shared test setup.

Environment variables are set BEFORE the app is imported so that tests use a
throwaway SQLite database and can never reach the real Gemini API.
"""
import itertools
import os
import tempfile
from pathlib import Path

_TMP = tempfile.mkdtemp(prefix="interviewiq-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(_TMP, 'test.db').as_posix()}"
os.environ["GEMINI_API_KEY"] = ""  # an empty value overrides any key in .env
os.environ["JWT_SECRET"] = "test-secret-only-for-automated-tests-0123456789"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.app.database import Base, engine  # noqa: E402
from backend.app.main import app  # noqa: E402

Base.metadata.create_all(bind=engine)

_counter = itertools.count(1)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def make_user(client):
    """Register a fresh user and return (user_id, auth_headers)."""

    def _make(name="Test User", password="secret1"):
        email = f"user{next(_counter)}@example.com"
        res = client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
        assert res.status_code == 200, res.text
        body = res.json()
        return body["user"]["id"], {"Authorization": f"Bearer {body['token']}"}

    return _make


@pytest.fixture()
def fake_gemini(monkeypatch):
    """Replace the Gemini text call. Usage: fake_gemini(json_string) -> list of prompts seen."""

    def _install(response_text):
        prompts = []

        async def fake_generate_text(prompt):
            prompts.append(prompt)
            return response_text

        monkeypatch.setattr("backend.app.services.ai_service.generate_text", fake_generate_text)
        return prompts

    return _install
