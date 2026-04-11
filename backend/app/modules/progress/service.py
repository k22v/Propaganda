from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models import Enrollment, LessonProgress, Course, Section, Chapter, LessonContent
from typing import Optional, List, Dict
from datetime import datetime


class ProgressRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_enrollment(self, user_id: int, course_id: int) -> Optional[Enrollment]:
        result = await self.db.execute(
            select(Enrollment).where(
                and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_user_enrollments(self, user_id: int) -> List[Enrollment]:
        result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id)
        )
        return list(result.scalars().all())

    async def create_enrollment(self, user_id: int, course_id: int) -> Enrollment:
        enrollment = Enrollment(user_id=user_id, course_id=course_id)
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment

    async def get_lesson_progress(self, enrollment_id: int, lesson_id: int) -> Optional[LessonProgress]:
        result = await self.db.execute(
            select(LessonProgress).where(
                and_(
                    LessonProgress.enrollment_id == enrollment_id,
                    LessonProgress.lesson_id == lesson_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_all_progress(self, enrollment_id: int) -> List[LessonProgress]:
        result = await self.db.execute(
            select(LessonProgress).where(LessonProgress.enrollment_id == enrollment_id)
        )
        return list(result.scalars().all())

    async def mark_lesson_complete(self, enrollment_id: int, lesson_id: int) -> LessonProgress:
        progress = await self.get_lesson_progress(enrollment_id, lesson_id)
        if progress:
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
        else:
            progress = LessonProgress(
                enrollment_id=enrollment_id,
                lesson_id=lesson_id,
                is_completed=True,
                completed_at=datetime.utcnow()
            )
            self.db.add(progress)
        await self.db.commit()
        await self.db.refresh(progress)
        return progress

    async def get_completed_lessons(self, enrollment_id: int) -> List[int]:
        result = await self.db.execute(
            select(LessonProgress.lesson_id).where(
                and_(
                    LessonProgress.enrollment_id == enrollment_id,
                    LessonProgress.is_completed == True
                )
            )
        )
        return list(result.scalars().all())


class ProgressService:
    def __init__(self, db: AsyncSession):
        self.repository = ProgressRepository(db)

    async def enroll_user(self, user_id: int, course_id: int) -> Enrollment:
        existing = await self.repository.get_enrollment(user_id, course_id)
        if existing:
            return existing
        return await self.repository.create_enrollment(user_id, course_id)

    async def get_user_courses(self, user_id: int) -> List[Enrollment]:
        return await self.repository.get_user_enrollments(user_id)

    async def mark_lesson_completed(self, user_id: int, course_id: int, lesson_id: int) -> Dict:
        enrollment = await self.repository.get_enrollment(user_id, course_id)
        if not enrollment:
            raise Exception("User not enrolled in course")

        progress = await self.repository.mark_lesson_complete(enrollment.id, lesson_id)
        
        completed_count = len(await self.repository.get_completed_lessons(enrollment.id))
        
        return {
            "lesson_id": lesson_id,
            "completed": True,
            "completed_lessons": completed_count
        }

    async def get_course_progress(self, user_id: int, course_id: int) -> Dict:
        enrollment = await self.repository.get_enrollment(user_id, course_id)
        if not enrollment:
            return {
                "enrolled": False,
                "completed_lessons": 0,
                "total_lessons": 0,
                "percentage": 0
            }

        completed = await self.repository.get_completed_lessons(enrollment.id)
        
        total_result = await self.db.execute(
            select(LessonContent).join(Chapter).join(Section).where(Section.course_id == course_id)
        )
        total_lessons = len(list(total_result.scalars().all()))
        
        percentage = (len(completed) / total_lessons * 100) if total_lessons > 0 else 0
        
        return {
            "enrolled": True,
            "completed_lessons": len(completed),
            "total_lessons": total_lessons,
            "percentage": round(percentage, 1)
        }

    async def is_lesson_unlocked(self, user_id: int, course_id: int, lesson_order: int) -> bool:
        if lesson_order == 1:
            return True
        
        enrollment = await self.repository.get_enrollment(user_id, course_id)
        if not enrollment:
            return False
        
        completed = await self.repository.get_completed_lessons(enrollment.id)
        
        return len(completed) >= lesson_order - 1
