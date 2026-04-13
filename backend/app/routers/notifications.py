from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.models import User, Notification
from app.auth import get_current_active_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    link: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CreateNotification(BaseModel):
    type: str
    message: str
    link: str | None = None


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    count = result.scalar() or 0
    return {"unread_count": count}


@router.post("/mark-read/{notification_id}")
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    
    notification.is_read = True
    await db.commit()
    return {"message": "Уведомление прочитано"}


@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    notifications = result.scalars().all()
    
    for n in notifications:
        n.is_read = True
    
    await db.commit()
    return {"message": "Все уведомления прочитаны"}


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    data: CreateNotification,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    notification = Notification(
        user_id=user_id,
        type=data.type,
        message=data.message,
        link=data.link
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification
