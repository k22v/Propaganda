import pytest


@pytest.mark.asyncio
async def test_create_course_as_superuser(client, superuser_headers, superuser):
    response = await client.post(
        "/api/courses/",
        headers=superuser_headers,
        json={
            "title": "Super Course",
            "description": "Created by superuser",
            "specialization": "dentist",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Super Course"
    assert data["author_id"] == superuser.id


@pytest.mark.asyncio
async def test_create_course_as_admin(client, admin_headers):
    response = await client.post(
        "/api/courses/",
        headers=admin_headers,
        json={
            "title": "Admin Course",
            "description": "Created by admin",
            "specialization": "dentist",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Admin Course"


@pytest.mark.asyncio
async def test_create_course_as_teacher(client, teacher_headers):
    response = await client.post(
        "/api/courses/",
        headers=teacher_headers,
        json={
            "title": "Teacher Course",
            "description": "Created by teacher",
            "specialization": "assistant",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Teacher Course"


@pytest.mark.asyncio
async def test_create_course_as_student_forbidden(client, auth_headers):
    response = await client.post(
        "/api/courses/",
        headers=auth_headers,
        json={
            "title": "Student Course",
            "description": "Should fail",
            "specialization": "dentist",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_course_unauthenticated(client):
    response = await client.post(
        "/api/courses/",
        json={
            "title": "No Auth Course",
            "description": "Should fail",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_course_public(client, auth_headers, test_course):
    response = await client.get(f"/api/courses/{test_course.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_course.title


@pytest.mark.asyncio
async def test_get_course_unpublished_only_for_authenticated(client, db_session):
    from app.models import Course, User
    
    teacher = User(
        email="teacher2@example.com",
        username="teacher2",
        hashed_password="hash",
        role="teacher",
    )
    db_session.add(teacher)
    await db_session.commit()
    
    unpublished_course = Course(
        title="Unpublished",
        description="Hidden",
        author_id=teacher.id,
        is_published=False,
    )
    db_session.add(unpublished_course)
    await db_session.commit()
    
    response = await client.get(f"/api/courses/{unpublished_course.id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_enroll_authenticated_user(client, auth_headers, test_course):
    response = await client.post(
        f"/api/courses/{test_course.id}/enroll",
        headers=auth_headers,
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_enroll_unauthenticated(client, test_course):
    response = await client.post(f"/api/courses/{test_course.id}/enroll")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_enroll_twice(client, auth_headers, test_course):
    await client.post(f"/api/courses/{test_course.id}/enroll", headers=auth_headers)
    
    response = await client.post(
        f"/api/courses/{test_course.id}/enroll",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "already enrolled" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_my_courses(client, auth_headers, db_session, test_user):
    from app.models import Course, Enrollment
    
    course = Course(
        title="My Course",
        description="Enrolled course",
        author_id=test_user.id,
    )
    db_session.add(course)
    await db_session.commit()
    
    enrollment = Enrollment(
        user_id=test_user.id,
        course_id=course.id,
    )
    db_session.add(enrollment)
    await db_session.commit()
    
    response = await client.get("/api/courses/my", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
