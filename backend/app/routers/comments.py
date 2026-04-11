from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.database import get_db
from app.models import User, Comment
from app.schemas import CommentCreate, CommentResponse
from app.auth import get_current_active_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/lesson/{lesson_id}", response_model=list[CommentResponse])
async def get_lesson_comments(
    lesson_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Comment)
        .where(Comment.lesson_id == lesson_id)
        .options(selectinload(Comment.user))
        .order_by(Comment.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=CommentResponse)
async def create_comment(
    data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    comment = Comment(
        lesson_id=data.lesson_id,
        user_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id
    )
    db.add(comment)
    await db.commit()
    
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment.id)
        .options(selectinload(Comment.user))
    )
    await db.refresh(comment)
    return comment


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
