import asyncio
from app.database import async_session_maker
from app.models import Enrollment, User, Course
from sqlalchemy import select

async def enroll_user():
    async with async_session_maker() as db:
        user = (await db.execute(select(User).where(User.username == 'loh228'))).scalar_one_or_none()
        course = (await db.execute(select(Course).where(Course.id == 2))).scalar_one_or_none()
        
        if not user:
            print("User not found")
            return
        if not course:
            print("Course not found")
            return
            
        existing = (await db.execute(
            select(Enrollment).where(Enrollment.user_id == user.id).where(Enrollment.course_id == course.id)
        )).scalar_one_or_none()
        
        if existing:
            print(f"User {user.username} already enrolled in course {course.id}")
        else:
            enrollment = Enrollment(user_id=user.id, course_id=course.id)
            db.add(enrollment)
            await db.commit()
            print(f"User {user.username} enrolled in course: {course.title}")

asyncio.run(enroll_user())
