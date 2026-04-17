from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List
import os
import uuid
from datetime import datetime
from app.database import get_db
from app.models import User, Course, Section, Chapter, LessonContent, Enrollment, Quiz
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse, CourseStructureResponse,
    SectionCreate, SectionUpdate, SectionResponse,
    ChapterCreate, ChapterUpdate, ChapterResponse,
    LessonContentCreate, LessonContentUpdate, LessonContentResponse,
    ReorderRequest
)
from app.auth import get_current_active_user
from app.policies import can_edit_course, require_permission, Permission, check_teacher_or_admin
from app.limiter import limiter
from app.sanitize import sanitize_html
from app.upload_utils import (
    validate_file,
    generate_secure_filename,
    get_file_category,
    MAX_FILE_SIZES
)

router = APIRouter(prefix="/courses", tags=["courses"])

DEFAULT_PAGE_SIZE = 12

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[CourseResponse])
async def list_courses(
    skip: int = 0,
    limit: int = DEFAULT_PAGE_SIZE,
    specialization: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Course).where(Course.is_published == True)
    
    if search:
        query = query.where(Course.title.ilike(f"%{search}%"))
    
    if current_user.is_superuser:
        pass
    elif specialization:
        if specialization != (current_user.specialization or ''):
            specialization = current_user.specialization
    else:
        specialization = current_user.specialization
    
    # For superuser: allow filtering by specialization if explicitly selected
    # For regular users: filter by their own specialization
    if current_user.is_superuser:
        if specialization:
            query = query.where(or_(Course.specialization == specialization, Course.specialization == None))
        # else: superuser sees all courses (no filter)
    elif specialization:
        query = query.where(Course.specialization == current_user.specialization)
    else:
        user_spec = current_user.specialization
        if user_spec:
            query = query.where(Course.specialization == user_spec)
        else:
            query = query.where(Course.specialization == None)
    
    result = await db.execute(
        query.options(selectinload(Course.author))
        .offset(skip).limit(limit)
    )
    courses = result.scalars().all()

    response = []
    for course in courses:
        lessons_result = await db.execute(
            select(func.count(LessonContent.id))
            .join(Chapter).join(Section)
            .where(Section.course_id == course.id)
        )
        lessons_count = lessons_result.scalar() or 0
        course_dict = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "cover_image": course.cover_image,
            "author_id": course.author_id,
            "is_published": course.is_published,
            "specialization": course.specialization,
            "start_date": course.start_date,
            "end_date": course.end_date,
            "created_at": course.created_at,
            "updated_at": course.updated_at,
            "lessons_count": lessons_count
        }
        response.append(course_dict)
    return response


@router.get("/my", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.is_superuser:
        result = await db.execute(
            select(Course)
            .options(selectinload(Course.author))
        )
    else:
        result = await db.execute(
            select(Course)
            .join(Enrollment).join(User)
            .where(User.id == current_user.id)
            .options(selectinload(Course.author))
        )
    courses = result.scalars().all()

    response = []
    for course in courses:
        lessons_result = await db.execute(
            select(func.count(LessonContent.id))
            .join(Chapter).join(Section)
            .where(Section.course_id == course.id)
        )
        lessons_count = lessons_result.scalar() or 0
        course_dict = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "cover_image": course.cover_image,
            "author_id": course.author_id,
            "is_published": course.is_published,
            "created_at": course.created_at,
            "updated_at": course.updated_at,
            "lessons_count": lessons_count
        }
        response.append(course_dict)
    return response


@router.post("/")
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    check_teacher_or_admin(current_user)

    try:
        course = Course(
            title=course_data.title,
            description=course_data.description,
            cover_image=course_data.cover_image,
            author_id=current_user.id,
            specialization=course_data.specialization,
            start_date=course_data.start_date,
            end_date=course_data.end_date
        )
        db.add(course)
        await db.commit()
        await db.refresh(course)
        return course
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating course: {str(e)}")


@router.get("/{course_id}", response_model=CourseStructureResponse)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        result = await db.execute(
            select(Course).where(Course.id == course_id)
        )
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        user_spec = current_user.specialization
        course_spec = course.specialization
        
        if not current_user.is_superuser:
            if course_spec and user_spec != course_spec:
                raise HTTPException(
                    status_code=403,
                    detail=f"Этот курс для специализации: {course_spec}. Ваша: {user_spec}"
                )
            if course_spec and not user_spec:
                raise HTTPException(
                    status_code=403,
                    detail="Установите специализацию в профиле"
                )

        now = datetime.utcnow()
        if course.start_date and course.end_date and not current_user.is_superuser:
            if now < course.start_date:
                raise HTTPException(
                    status_code=403,
                    detail=f"Курс будет доступен с {course.start_date.strftime('%d.%m.%Y')}"
                )
            if now > course.end_date:
                raise HTTPException(
                    status_code=403,
                    detail=f"Срок прохождения курса истёк {course.end_date.strftime('%d.%m.%Y')}"
                )

        sections_result = await db.execute(
            select(Section)
            .where(Section.course_id == course_id)
            .order_by(Section.order)
        )
        sections = sections_result.scalars().all()

        sections_with_chapters = []
        for section in sections:
            chapters_result = await db.execute(
                select(Chapter)
                .where(Chapter.section_id == section.id)
                .order_by(Chapter.order)
            )
            chapters = chapters_result.scalars().all()

            chapters_with_contents = []
            for chapter in chapters:
                contents_result = await db.execute(
                    select(LessonContent)
                    .where(LessonContent.chapter_id == chapter.id)
                    .order_by(LessonContent.order)
                )
                contents = contents_result.scalars().all()

                contents_list = []
                for c in contents:
                    contents_list.append({
                        "id": c.id,
                        "chapter_id": c.chapter_id,
                        "title": c.title,
                        "content_type": c.content_type,
                        "content": c.content,
                        "video_url": c.video_url,
                        "file_url": c.file_url,
                        "duration": c.duration,
                        "order": c.order,
                        "created_at": c.created_at
                    })

                quiz_data = None
                try:
                    for content in chapter.contents:
                        quiz_result = await db.execute(
                            select(Quiz).where(Quiz.lesson_id == content.id)
                        )
                        quiz = quiz_result.scalar_one_or_none()
                        if quiz:
                            quiz_data = {
                                "id": quiz.id,
                                "title": quiz.title,
                                "description": quiz.description,
                                "passing_score": quiz.passing_score
                            }
                            break
                except Exception as e:
                    quiz_data = None
                
                chapters_with_contents.append({
                    "id": chapter.id,
                    "title": chapter.title,
                    "description": chapter.description,
                    "order": chapter.order,
                    "contents": contents_list,
                    "quiz": quiz_data
                })

            sections_with_chapters.append({
                "id": section.id,
                "title": section.title,
                "description": section.description,
                "order": section.order,
                "chapters": chapters_with_contents
            })

        is_enrolled = False
        if current_user:
            enrollment_result = await db.execute(
                select(Enrollment).where(
                    Enrollment.user_id == current_user.id,
                    Enrollment.course_id == course_id
                )
            )
            is_enrolled = enrollment_result.scalar_one_or_none() is not None

        return {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "cover_image": course.cover_image,
            "author_id": course.author_id,
            "is_published": course.is_published,
            "is_enrolled": is_enrolled,
            "specialization": course.specialization,
            "start_date": course.start_date,
            "end_date": course.end_date,
            "sections": sections_with_chapters
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"get_course error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    if course_data.title is not None:
        course.title = course_data.title
    if course_data.description is not None:
        course.description = course_data.description
    if course_data.cover_image is not None:
        course.cover_image = course_data.cover_image
    if course_data.is_published is not None:
        course.is_published = course_data.is_published
    
    is_superuser = current_user.is_superuser or current_user.id == course.author_id
    
    if course_data.specialization is not None:
        course.specialization = course_data.specialization
    
    if course_data.start_date is not None and is_superuser:
        course.start_date = course_data.start_date
    if course_data.end_date is not None and is_superuser:
        course.end_date = course_data.end_date

    await db.commit()
    await db.refresh(course)

    lessons_result = await db.execute(
        select(func.count(LessonContent.id))
        .join(Chapter).join(Section)
        .where(Section.course_id == course.id)
    )
    lessons_count = lessons_result.scalar() or 0

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "cover_image": course.cover_image,
        "author_id": course.author_id,
        "is_published": course.is_published,
        "specialization": course.specialization,
        "start_date": course.start_date,
        "end_date": course.end_date,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "lessons_count": lessons_count
    }


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(course)
    await db.commit()
    return {"message": "Course deleted"}


@router.post("/{course_id}/sections", response_model=SectionResponse)
async def create_section(
    course_id: int,
    section_data: SectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    section = Section(
        course_id=course_id,
        title=section_data.title,
        description=section_data.description,
        order=section_data.order
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)

    chapters_result = await db.execute(
        select(func.count(Chapter.id)).where(Chapter.section_id == section.id)
    )
    chapters_count = chapters_result.scalar() or 0

    return {
        "id": section.id,
        "course_id": section.course_id,
        "title": section.title,
        "description": section.description,
        "order": section.order,
        "created_at": section.created_at,
        "chapters_count": chapters_count
    }


@router.delete("/{course_id}/sections/{section_id}")
async def delete_section(
    course_id: int,
    section_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    section_result = await db.execute(
        select(Section).where(Section.id == section_id)
    )
    section = section_result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    try:
        chapters_result = await db.execute(
            select(Chapter).where(Chapter.section_id == section_id)
        )
        chapters = chapters_result.scalars().all()
        
        for chapter in chapters:
            contents_result = await db.execute(
                select(LessonContent).where(LessonContent.chapter_id == chapter.id)
            )
            contents = contents_result.scalars().all()
            
            for content in contents:
                quizzes_result = await db.execute(
                    select(Quiz).where(Quiz.lesson_id == content.id)
                )
                quizzes = quizzes_result.scalars().all()
                for quiz in quizzes:
                    await db.delete(quiz)
                
                await db.delete(content)
            await db.delete(chapter)
        
        await db.delete(section)
        await db.commit()
        return {"message": "Section deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting section: {str(e)}")


@router.post("/{course_id}/chapters", response_model=ChapterResponse)
async def create_chapter(
    course_id: int,
    chapter_data: ChapterCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    chapter = Chapter(
        section_id=chapter_data.section_id,
        title=chapter_data.title,
        description=chapter_data.description,
        order=chapter_data.order
    )
    db.add(chapter)
    await db.commit()
    await db.refresh(chapter)

    contents_result = await db.execute(
        select(func.count(LessonContent.id)).where(LessonContent.chapter_id == chapter.id)
    )
    contents_count = contents_result.scalar() or 0

    return {
        "id": chapter.id,
        "section_id": chapter.section_id,
        "title": chapter.title,
        "description": chapter.description,
        "order": chapter.order,
        "created_at": chapter.created_at,
        "contents_count": contents_count
    }


@router.delete("/{course_id}/chapters/{chapter_id}")
async def delete_chapter(
    course_id: int,
    chapter_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    chapter_result = await db.execute(
        select(Chapter).where(Chapter.id == chapter_id)
    )
    chapter = chapter_result.scalar_one_or_none()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    await db.delete(chapter)
    await db.commit()
    return {"message": "Chapter deleted"}


@router.post("/{course_id}/contents", response_model=LessonContentResponse)
async def create_content(
    course_id: int,
    content_data: LessonContentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    content = LessonContent(
        chapter_id=content_data.chapter_id,
        title=content_data.title,
        content_type=content_data.content_type,
        content=sanitize_html(content_data.content or ''),
        video_url=content_data.video_url,
        file_url=content_data.file_url,
        duration=content_data.duration,
        order=content_data.order
    )
    db.add(content)
    await db.commit()
    await db.refresh(content)

    return {
        "id": content.id,
        "chapter_id": content.chapter_id,
        "title": content.title,
        "content_type": content.content_type,
        "content": content.content,
        "video_url": content.video_url,
        "file_url": content.file_url,
        "duration": content.duration,
        "order": content.order,
        "created_at": content.created_at,
        "has_quiz": False
    }


@router.patch("/{course_id}/contents/{content_id}", response_model=LessonContentResponse)
async def update_content(
    course_id: int,
    content_id: int,
    content_data: LessonContentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    content_result = await db.execute(
        select(LessonContent).where(LessonContent.id == content_id)
    )
    content = content_result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    if content_data.title is not None:
        content.title = content_data.title
    if content_data.content_type is not None:
        content.content_type = content_data.content_type
    if content_data.content is not None:
        content.content = sanitize_html(content_data.content)
    if content_data.video_url is not None:
        content.video_url = content_data.video_url
    if content_data.file_url is not None:
        content.file_url = content_data.file_url
    if content_data.duration is not None:
        content.duration = content_data.duration
    if content_data.order is not None:
        content.order = content_data.order

    await db.commit()
    await db.refresh(content)

    return {
        "id": content.id,
        "chapter_id": content.chapter_id,
        "title": content.title,
        "content_type": content.content_type,
        "content": content.content,
        "video_url": content.video_url,
        "file_url": content.file_url,
        "duration": content.duration,
        "order": content.order,
        "created_at": content.created_at,
        "has_quiz": False
    }


@router.delete("/{course_id}/contents/{content_id}")
async def delete_content(
    course_id: int,
    content_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    content_result = await db.execute(
        select(LessonContent).where(LessonContent.id == content_id)
    )
    content = content_result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    await db.delete(content)
    await db.commit()
    return {"message": "Content deleted"}


@router.post("/{course_id}/sections/reorder")
async def reorder_sections(
    course_id: int,
    reorder_data: ReorderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    for item in reorder_data.items:
        result = await db.execute(
            select(Section).where(Section.id == item.id)
        )
        section = result.scalar_one_or_none()
        if section:
            section.order = item.order

    await db.commit()
    return {"message": "Sections reordered"}


@router.post("/{course_id}/chapters/reorder")
async def reorder_chapters(
    course_id: int,
    reorder_data: ReorderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    for item in reorder_data.items:
        result = await db.execute(
            select(Chapter).where(Chapter.id == item.id)
        )
        chapter = result.scalar_one_or_none()
        if chapter:
            chapter.order = item.order

    await db.commit()
    return {"message": "Chapters reordered"}


@router.post("/{course_id}/contents/reorder")
async def reorder_contents(
    course_id: int,
    reorder_data: ReorderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course or not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    for item in reorder_data.items:
        result = await db.execute(
            select(LessonContent).where(LessonContent.id == item.id)
        )
        content = result.scalar_one_or_none()
        if content:
            content.order = item.order

    await db.commit()
    return {"message": "Contents reordered"}


@router.post("/{course_id}/enroll")
@limiter.limit("5/minute")
async def enroll_course(
    request: Request,
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    now = datetime.utcnow()
    if course.start_date and course.end_date:
        if current_user.is_superuser:
            pass
        elif now < course.start_date:
            raise HTTPException(status_code=403, detail=f"Курс будет доступен с {course.start_date.strftime('%d.%m.%Y')}")
        elif now > course.end_date:
            raise HTTPException(status_code=403, detail=f"Срок прохождения курса истёк {course.end_date.strftime('%d.%m.%Y')}")

    existing = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.course_id == course_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(enrollment)
    await db.commit()
    return {"message": "Enrolled successfully"}


@router.get("/{course_id}/contents/{content_id}", response_model=LessonContentResponse)
async def get_content(
    course_id: int,
    content_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if not current_user.is_superuser:
        user_spec = (current_user.specialization or '').strip().lower()
        course_spec = (course.specialization or '').strip().lower()
        if course_spec and user_spec != course_spec:
            raise HTTPException(
                status_code=403,
                detail=f"Этот курс предназначен для специализации: {course_spec}. Ваша специализация: {user_spec}"
            )
        if course_spec and not user_spec:
            raise HTTPException(
                status_code=403,
                detail="Для доступа к курсу установите специализацию в профиле"
            )

    if not course.is_published and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Course not available")

    if not current_user.is_superuser:
        enrollment_result = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id
            )
        )
        if not enrollment_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not enrolled")

    content_result = await db.execute(
        select(LessonContent).where(LessonContent.id == content_id)
    )
    content = content_result.scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    return {
        "id": content.id,
        "chapter_id": content.chapter_id,
        "title": content.title,
        "content_type": content.content_type,
        "content": content.content,
        "video_url": content.video_url,
        "file_url": content.file_url,
        "duration": content.duration,
        "order": content.order,
        "created_at": content.created_at,
        "has_quiz": False
    }


@router.post("/upload")
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file type and size
    content_type = file.content_type or 'application/octet-stream'
    validate_file(file.filename, content_type, file_size)
    
    # Get category for size limit
    category = get_file_category(file.filename)
    max_size = MAX_FILE_SIZES.get(category, 10 * 1024 * 1024) if category else 10 * 1024 * 1024
    
    # Generate secure filename
    safe_filename = generate_secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Write file
    with open(file_path, "wb") as f:
        f.write(content)
    
    return {
        "url": f"/uploads/{safe_filename}",
        "filename": safe_filename
    }
