from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import Course, Section, Chapter, LessonContent, Enrollment
from app.schemas import CourseCreate, CourseUpdate, CourseResponse
from typing import Optional, List


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, course_id: int) -> Optional[Course]:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Course]:
        result = await self.db.execute(select(Course).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def get_published(self, skip: int = 0, limit: int = 100) -> List[Course]:
        result = await self.db.execute(
            select(Course).where(Course.is_published == True).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_author(self, author_id: int) -> List[Course]:
        result = await self.db.execute(select(Course).where(Course.author_id == author_id))
        return list(result.scalars().all())

    async def create(self, course_data: CourseCreate, author_id: int) -> Course:
        course = Course(
            title=course_data.title,
            description=course_data.description,
            cover_image=course_data.cover_image,
            author_id=author_id
        )
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def update(self, course: Course, **kwargs) -> Course:
        for key, value in kwargs.items():
            if hasattr(course, key) and value is not None:
                setattr(course, key, value)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def delete(self, course: Course) -> None:
        await self.db.delete(course)
        await self.db.commit()

    async def get_with_enrollment_count(self, course_id: int) -> Optional[dict]:
        course = await self.get_by_id(course_id)
        if not course:
            return None
        
        result = await self.db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
        )
        enrollment_count = result.scalar()
        
        return {
            "course": course,
            "enrollment_count": enrollment_count
        }


class SectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, section_id: int) -> Optional[Section]:
        result = await self.db.execute(select(Section).where(Section.id == section_id))
        return result.scalar_one_or_none()

    async def get_by_course(self, course_id: int) -> List[Section]:
        result = await self.db.execute(
            select(Section).where(Section.course_id == course_id).order_by(Section.order)
        )
        return list(result.scalars().all())

    async def create(self, section_data, course_id: int) -> Section:
        section = Section(
            title=section_data.title,
            description=section_data.description,
            order=section_data.order,
            course_id=course_id
        )
        self.db.add(section)
        await self.db.commit()
        await self.db.refresh(section)
        return section

    async def delete(self, section: Section) -> None:
        await self.db.delete(section)
        await self.db.commit()


class ChapterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, chapter_id: int) -> Optional[Chapter]:
        result = await self.db.execute(select(Chapter).where(Chapter.id == chapter_id))
        return result.scalar_one_or_none()

    async def get_by_section(self, section_id: int) -> List[Chapter]:
        result = await self.db.execute(
            select(Chapter).where(Chapter.section_id == section_id).order_by(Chapter.order)
        )
        return list(result.scalars().all())

    async def create(self, chapter_data, section_id: int) -> Chapter:
        chapter = Chapter(
            title=chapter_data.title,
            description=chapter_data.description,
            order=chapter_data.order,
            section_id=section_id
        )
        self.db.add(chapter)
        await self.db.commit()
        await self.db.refresh(chapter)
        return chapter


class LessonContentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, content_id: int) -> Optional[LessonContent]:
        result = await self.db.execute(select(LessonContent).where(LessonContent.id == content_id))
        return result.scalar_one_or_none()

    async def get_by_chapter(self, chapter_id: int) -> List[LessonContent]:
        result = await self.db.execute(
            select(LessonContent).where(LessonContent.chapter_id == chapter_id).order_by(LessonContent.order)
        )
        return list(result.scalars().all())

    async def create(self, content_data, chapter_id: int) -> LessonContent:
        content = LessonContent(
            title=content_data.title,
            content_type=content_data.content_type,
            content=content_data.content,
            video_url=content_data.video_url,
            file_url=content_data.file_url,
            model_url=getattr(content_data, 'model_url', None),
            xray_image=getattr(content_data, 'xray_image', None),
            hotspots_data=getattr(content_data, 'hotspots_data', None),
            duration=content_data.duration,
            order=content_data.order,
            chapter_id=chapter_id
        )
        self.db.add(content)
        await self.db.commit()
        await self.db.refresh(content)
        return content
