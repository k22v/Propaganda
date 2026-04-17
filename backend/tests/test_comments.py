import pytest


@pytest.mark.asyncio
async def test_get_comments_authenticated(client, auth_headers, db_session):
    from app.models import LessonContent, Section, Chapter, Course, User
    
    teacher = User(
        email="teacher3@example.com",
        username="teacher3",
        hashed_password="hash",
        role="teacher",
    )
    db_session.add(teacher)
    await db_session.commit()
    
    course = Course(
        title="Comment Test Course",
        description="For comments test",
        author_id=teacher.id,
    )
    db_session.add(course)
    await db_session.commit()
    
    section = Section(
        course_id=course.id,
        title="Section 1",
    )
    db_session.add(section)
    await db_session.commit()
    
    chapter = Chapter(
        section_id=section.id,
        title="Chapter 1",
    )
    db_session.add(chapter)
    await db_session.commit()
    
    lesson = LessonContent(
        chapter_id=chapter.id,
        title="Lesson 1",
    )
    db_session.add(lesson)
    await db_session.commit()
    
    response = await client.get(
        f"/api/comments/lesson/{lesson.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200 or response.status_code == 403


@pytest.mark.asyncio
async def test_get_comments_unauthenticated(client, db_session):
    from app.models import LessonContent, Section, Chapter, Course, User
    
    teacher = User(
        email="teacher4@example.com",
        username="teacher4",
        hashed_password="hash",
        role="teacher",
    )
    db_session.add(teacher)
    await db_session.commit()
    
    course = Course(
        title="Comment Test Course 2",
        description="For comments test",
        author_id=teacher.id,
    )
    db_session.add(course)
    await db_session.commit()
    
    section = Section(
        course_id=course.id,
        title="Section 1",
    )
    db_session.add(section)
    await db_session.commit()
    
    chapter = Chapter(
        section_id=section.id,
        title="Chapter 1",
    )
    db_session.add(chapter)
    await db_session.commit()
    
    lesson = LessonContent(
        chapter_id=chapter.id,
        title="Lesson 1",
    )
    db_session.add(lesson)
    await db_session.commit()
    
    response = await client.get(f"/api/comments/lesson/{lesson.id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_comment_authenticated(client, auth_headers, db_session):
    from app.models import LessonContent, Section, Chapter, Course, User, Enrollment
    
    teacher = User(
        email="teacher5@example.com",
        username="teacher5",
        hashed_password="hash",
        role="teacher",
    )
    db_session.add(teacher)
    await db_session.commit()
    
    course = Course(
        title="Comment Create Course",
        description="For comments test",
        author_id=teacher.id,
    )
    db_session.add(course)
    await db_session.commit()
    
    section = Section(
        course_id=course.id,
        title="Section 1",
    )
    db_session.add(section)
    await db_session.commit()
    
    chapter = Chapter(
        section_id=section.id,
        title="Chapter 1",
    )
    db_session.add(chapter)
    await db_session.commit()
    
    lesson = LessonContent(
        chapter_id=chapter.id,
        title="Lesson 1",
    )
    db_session.add(lesson)
    await db_session.commit()
    
    from app.models import User as UserModel
    from sqlalchemy import select
    result = await db_session.execute(select(UserModel).where(UserModel.username == "testuser"))
    test_user = result.scalar_one()
    
    enrollment = Enrollment(
        user_id=test_user.id,
        course_id=course.id,
    )
    db_session.add(enrollment)
    await db_session.commit()
    
    response = await client.post(
        "/api/comments/",
        headers=auth_headers,
        json={
            "lesson_id": lesson.id,
            "content": "Test comment",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Test comment"


@pytest.mark.asyncio
async def test_delete_own_comment(client, auth_headers, db_session):
    from app.models import LessonContent, Section, Chapter, Course, User, Enrollment, Comment
    
    teacher = User(
        email="teacher6@example.com",
        username="teacher6",
        hashed_password="hash",
        role="teacher",
    )
    db_session.add(teacher)
    await db_session.commit()
    
    course = Course(
        title="Delete Comment Course",
        description="For comments test",
        author_id=teacher.id,
    )
    db_session.add(course)
    await db_session.commit()
    
    section = Section(
        course_id=course.id,
        title="Section 1",
    )
    db_session.add(section)
    await db_session.commit()
    
    chapter = Chapter(
        section_id=section.id,
        title="Chapter 1",
    )
    db_session.add(chapter)
    await db_session.commit()
    
    lesson = LessonContent(
        chapter_id=chapter.id,
        title="Lesson 1",
    )
    db_session.add(lesson)
    await db_session.commit()
    
    from app.models import User as UserModel
    from sqlalchemy import select
    result = await db_session.execute(select(UserModel).where(UserModel.username == "testuser"))
    test_user = result.scalar_one()
    
    enrollment = Enrollment(
        user_id=test_user.id,
        course_id=course.id,
    )
    db_session.add(enrollment)
    await db_session.commit()
    
    comment = Comment(
        lesson_id=lesson.id,
        user_id=test_user.id,
        content="Comment to delete",
    )
    db_session.add(comment)
    await db_session.commit()
    
    response = await client.delete(
        f"/api/comments/{comment.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
