import pytest
from app.models import User


@pytest.mark.asyncio
async def test_register(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
            "specialization": "dentist",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert data["role"] == "student"
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "test@example.com",
            "username": "differentuser",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_username(client, test_user):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "different@example.com",
            "username": "testuser",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "taken" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client, test_user):
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, test_user):
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    response = await client.post(
        "/api/auth/login",
        data={"username": "nonexistent", "password": "password123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user(client, db_session, test_user):
    test_user.is_active = False
    await db_session.commit()
    
    response = await client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpass123"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_me(client, auth_headers, test_user):
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["username"] == test_user.username


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client, auth_headers):
    response = await client.post("/api/auth/logout", headers=auth_headers)
    assert response.status_code == 200
