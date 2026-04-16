from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import User, Comment, Enrollment, LessonContent, Course, Chapter, Section
from app.schemas import CommentCreate, CommentResponse
from app.auth import get_current_active_user, get_current_user_optional

router = APIRouter(prefix="/comments", tags=["comments"])


async def check_user_can_access_lesson(db: AsyncSession, user_id: int, lesson_id: int) -> bool:
    result = await db.execute(
        select(Course.id)
        .select_from(LessonContent)
        .join(Chapter, LessonContent.chapter_id == Chapter.id)
        .join(Section, Chapter.section_id == Section.id)
        .join(Course, Section.course_id == Course.id)
        .where(LessonContent.id == lesson_id)
    )
    course_id = result.scalar_one_or_none()

    if not course_id:
        return False

    result = await db.execute(
        select(func.count(Enrollment.id)).where(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
    )
    count = result.scalar() or 0
    return count > 0


@router.get("/lesson/{lesson_id}", response_model=List[CommentResponse])
async def get_lesson_comments(
    lesson_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if current_user and (current_user.is_superuser or current_user.role == 'admin'):
        result = await db.execute(
            select(Comment)
            .where(Comment.lesson_id == lesson_id)
            .options(selectinload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
    elif current_user:
        has_access = await check_user_can_access_lesson(db, current_user.id, lesson_id)
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="No access to this lesson"
            )
        result = await db.execute(
            select(Comment)
            .where(Comment.lesson_id == lesson_id)
            .options(selectinload(Comment.user))
            .order_by(Comment.created_at.desc())
        )
    else:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    
    return result.scalars().all()


@router.post("/", response_model=CommentResponse)
async def create_comment(
    data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    has_access = await check_user_can_access_lesson(db, current_user.id, data.lesson_id)
    if not has_access:
        raise HTTPException(
            status_code=403,
            detail="No access to this lesson"
        )
    
    comment = Comment(
        lesson_id=data.lesson_id,
        user_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment.id)
        .options(selectinload(Comment.user))
    )
    return result.scalar_one()


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted"}
