import pytest


@pytest.mark.asyncio
async def test_admin_get_users_as_admin(client, admin_headers):
    response = await client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "total" in data
    assert isinstance(data["users"], list)


@pytest.mark.asyncio
async def test_admin_get_users_as_superuser(client, superuser_headers):
    response = await client.get("/api/admin/users", headers=superuser_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_get_users_as_student_forbidden(client, auth_headers):
    response = await client.get("/api/admin/users", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_get_users_unauthenticated(client):
    response = await client.get("/api/admin/users")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_filter_by_role(client, admin_headers):
    response = await client.get(
        "/api/admin/users",
        headers=admin_headers,
        params={"role": "student"},
    )
    assert response.status_code == 200
    data = response.json()
    for user in data["users"]:
        assert user["role"] == "student"


@pytest.mark.asyncio
async def test_admin_filter_by_search(client, admin_headers, test_user):
    response = await client.get(
        "/api/admin/users",
        headers=admin_headers,
        params={"search": "test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) > 0


@pytest.mark.asyncio
async def test_admin_update_user_role(client, admin_headers, db_session):
    from app.models import User
    
    new_user = User(
        email="rolechange@example.com",
        username="rolechange",
        hashed_password="hash",
        role="student",
    )
    db_session.add(new_user)
    await db_session.commit()
    
    response = await client.patch(
        f"/api/admin/users/{new_user.id}/role",
        headers=admin_headers,
        json={"role": "teacher"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "teacher"


@pytest.mark.asyncio
async def test_admin_update_invalid_role(client, admin_headers, db_session):
    from app.models import User
    
    new_user = User(
        email="invalidrole@example.com",
        username="invalidrole",
        hashed_password="hash",
        role="student",
    )
    db_session.add(new_user)
    await db_session.commit()
    
    response = await client.patch(
        f"/api/admin/users/{new_user.id}/role",
        headers=admin_headers,
        json={"role": "invalid_role"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_admin_toggle_user_block(client, admin_headers, db_session):
    from app.models import User
    
    new_user = User(
        email="blockuser@example.com",
        username="blockuser",
        hashed_password="hash",
        role="student",
        is_active=True,
    )
    db_session.add(new_user)
    await db_session.commit()
    
    response = await client.patch(
        f"/api/admin/users/{new_user.id}/block",
        headers=admin_headers,
    )
    assert response.status_code == 200
    
    result = await db_session.execute(
        pytest.importorskip("sqlalchemy").select(User).where(User.id == new_user.id)
    )
    user = result.scalar_one()
    assert user.is_active == False


@pytest.mark.asyncio
async def test_admin_delete_user(client, admin_headers, db_session):
    from app.models import User
    
    new_user = User(
        email="deleteuser@example.com",
        username="deleteuser",
        hashed_password="hash",
        role="student",
    )
    db_session.add(new_user)
    await db_session.commit()
    user_id = new_user.id
    
    response = await client.delete(
        f"/api/admin/users/{user_id}",
        headers=admin_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_cannot_delete_self(client, admin_headers, admin_user):
    response = await client.delete(
        f"/api/admin/users/{admin_user.id}",
        headers=admin_headers,
    )
    assert response.status_code == 400
    assert "yourself" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_stats(client, admin_headers):
    response = await client.get("/api/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert "courses" in data
    assert "active_users" in data
