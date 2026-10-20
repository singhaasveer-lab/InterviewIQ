import pytest


def test_register_login_and_me(client):
    res = client.post("/api/auth/register", json={"name": "A", "email": "Case@Example.com", "password": "secret1"})
    assert res.status_code == 200
    token = res.json()["token"]

    # login is case-insensitive on the email
    res = client.post("/api/auth/login", json={"email": "case@example.com", "password": "secret1"})
    assert res.status_code == 200

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "case@example.com"


def test_duplicate_email_is_rejected_case_insensitively(client):
    client.post("/api/auth/register", json={"name": "A", "email": "dup@example.com", "password": "secret1"})
    res = client.post("/api/auth/register", json={"name": "B", "email": "DUP@example.com", "password": "secret1"})
    assert res.status_code == 409


def test_short_password_is_rejected(client):
    res = client.post("/api/auth/register", json={"name": "A", "email": "short@example.com", "password": "123"})
    assert res.status_code == 422


def test_wrong_password_is_rejected(client, make_user):
    res = client.post("/api/auth/register", json={"name": "A", "email": "wrongpw@example.com", "password": "secret1"})
    assert res.status_code == 200
    res = client.post("/api/auth/login", json={"email": "wrongpw@example.com", "password": "nope-nope"})
    assert res.status_code == 401


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/auth/me"),
        ("get", "/api/interview/history"),
        ("get", "/api/analytics"),
        ("get", "/api/profile"),
        ("get", "/api/aptitude/attempts"),
        ("get", "/api/rag/documents"),
        ("post", "/api/aptitude/generate"),
        ("post", "/api/chat"),
    ],
)
def test_protected_routes_require_login(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_fake_or_old_demo_token_is_rejected(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer user-demo-1"})
    assert res.status_code == 401


def test_users_cannot_see_each_others_documents(client, make_user):
    _, a = make_user()
    _, b = make_user()
    up = client.post("/api/rag/upload", headers=a, json={"title": "Mine", "content": "alpha\n\nbeta", "category": "notes"})
    assert up.status_code == 200
    assert len(client.get("/api/rag/documents", headers=a).json()) == 1
    assert client.get("/api/rag/documents", headers=b).json() == []


def test_update_and_delete_account(client, make_user):
    uid, h = make_user()
    assert client.patch("/api/auth/me", headers=h, json={"name": " New Name "}).json()["name"] == "New Name"
    assert client.delete("/api/auth/me", headers=h).status_code == 200
    assert client.get("/api/auth/me", headers=h).status_code == 401
