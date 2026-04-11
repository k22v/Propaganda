from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.courses.repository import (
    CourseRepository, SectionRepository, ChapterRepository, LessonContentRepository
)
from app.schemas import CourseCreate, CourseUpdate, CourseResponse
from typing import Optional, List
from fastapi import HTTPException, status


class CourseService:
    def __init__(self, db: AsyncSession):
        self.course_repo = CourseRepository(db)
        self.section_repo = SectionRepository(db)
        self.chapter_repo = ChapterRepository(db)
        self.content_repo = LessonContentRepository(db)

    async def create_course(self, author_id: int, course_data: CourseCreate) -> CourseResponse:
        course = await self.course_repo.create(course_data, author_id)
        return CourseResponse.model_validate(course)

    async def get_course(self, course_id: int) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return CourseResponse.model_validate(course)

    async def get_courses(self, skip: int = 0, limit: int = 100) -> List[CourseResponse]:
        courses = await self.course_repo.get_all(skip=skip, limit=limit)
        return [CourseResponse.model_validate(c) for c in courses]

    async def get_published_courses(self, skip: int = 0, limit: int = 100) -> List[CourseResponse]:
        courses = await self.course_repo.get_published(skip=skip, limit=limit)
        return [CourseResponse.model_validate(c) for c in courses]

    async def get_my_courses(self, user_id: int) -> List[CourseResponse]:
        courses = await self.course_repo.get_by_author(user_id)
        return [CourseResponse.model_validate(c) for c in courses]

    async def update_course(self, course_id: int, course_data: CourseUpdate) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        update_data = course_data.model_dump(exclude_unset=True)
        updated = await self.course_repo.update(course, **update_data)
        return CourseResponse.model_validate(updated)

    async def delete_course(self, course_id: int) -> None:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        await self.course_repo.delete(course)

    async def publish_course(self, course_id: int) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        updated = await self.course_repo.update(course, is_published=True)
        return CourseResponse.model_validate(updated)

    async def unpublish_course(self, course_id: int) -> CourseResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        updated = await self.course_repo.update(course, is_published=False)
        return CourseResponse.model_validate(updated)
