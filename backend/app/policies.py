from enum import Enum
from functools import wraps
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.database import get_db
from app.auth import get_current_user


class Permission(str, Enum):
    # Course permissions
    CAN_VIEW_COURSE = "can_view_course"
    CAN_CREATE_COURSE = "can_create_course"
    CAN_EDIT_COURSE = "can_edit_course"
    CAN_PUBLISH_COURSE = "can_publish_course"
    CAN_DELETE_COURSE = "can_delete_course"
    
    # Quiz permissions
    CAN_VIEW_QUIZ = "can_view_quiz"
    CAN_CREATE_QUIZ = "can_create_quiz"
    CAN_EDIT_QUIZ = "can_edit_quiz"
    CAN_DELETE_QUIZ = "can_delete_quiz"
    
    # Content permissions
    CAN_VIEW_CONTENT = "can_view_content"
    CAN_CREATE_CONTENT = "can_create_content"
    CAN_EDIT_CONTENT = "can_edit_content"
    CAN_DELETE_CONTENT = "can_delete_content"
    
    # Review permissions
    CAN_CREATE_REVIEW = "can_create_review"
    CAN_EDIT_REVIEW = "can_edit_review"
    CAN_DELETE_REVIEW = "can_delete_review"
    
    # Comment permissions
    CAN_CREATE_COMMENT = "can_create_comment"
    CAN_DELETE_COMMENT = "can_delete_comment"
    
    # User permissions
    CAN_VIEW_USERS = "can_view_users"
    CAN_EDIT_USER = "can_edit_user"
    CAN_BLOCK_USER = "can_block_user"
    CAN_DELETE_USER = "can_delete_user"
    
    # Admin permissions
    CAN_VIEW_ADMIN = "can_view_admin"
    CAN_VIEW_STATS = "can_view_stats"
    CAN_SEND_NOTIFICATIONS = "can_send_notifications"
    
    # Upload permissions
    CAN_UPLOAD_MEDIA = "can_upload_media"
    CAN_VIEW_MEDIA = "can_view_media"


# Role-based permission matrix
ROLE_PERMISSIONS = {
    "admin": [
        Permission.CAN_VIEW_COURSE,
        Permission.CAN_CREATE_COURSE,
        Permission.CAN_EDIT_COURSE,
        Permission.CAN_PUBLISH_COURSE,
        Permission.CAN_DELETE_COURSE,
        Permission.CAN_VIEW_QUIZ,
        Permission.CAN_CREATE_QUIZ,
        Permission.CAN_EDIT_QUIZ,
        Permission.CAN_DELETE_QUIZ,
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_CREATE_CONTENT,
        Permission.CAN_EDIT_CONTENT,
        Permission.CAN_DELETE_CONTENT,
        Permission.CAN_CREATE_REVIEW,
        Permission.CAN_EDIT_REVIEW,
        Permission.CAN_DELETE_REVIEW,
        Permission.CAN_CREATE_COMMENT,
        Permission.CAN_DELETE_COMMENT,
        Permission.CAN_VIEW_USERS,
        Permission.CAN_EDIT_USER,
        Permission.CAN_BLOCK_USER,
        Permission.CAN_DELETE_USER,
        Permission.CAN_VIEW_ADMIN,
        Permission.CAN_VIEW_STATS,
        Permission.CAN_SEND_NOTIFICATIONS,
        Permission.CAN_UPLOAD_MEDIA,
        Permission.CAN_VIEW_MEDIA,
    ],
    "teacher": [
        Permission.CAN_VIEW_COURSE,
        Permission.CAN_CREATE_COURSE,
        Permission.CAN_EDIT_COURSE,
        Permission.CAN_PUBLISH_COURSE,
        Permission.CAN_DELETE_COURSE,
        Permission.CAN_VIEW_QUIZ,
        Permission.CAN_CREATE_QUIZ,
        Permission.CAN_EDIT_QUIZ,
        Permission.CAN_DELETE_QUIZ,
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_CREATE_CONTENT,
        Permission.CAN_EDIT_CONTENT,
        Permission.CAN_DELETE_CONTENT,
        Permission.CAN_CREATE_REVIEW,
        Permission.CAN_CREATE_COMMENT,
        Permission.CAN_UPLOAD_MEDIA,
        Permission.CAN_VIEW_MEDIA,
    ],
    "student": [
        Permission.CAN_VIEW_COURSE,
        Permission.CAN_VIEW_QUIZ,
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_CREATE_REVIEW,
        Permission.CAN_EDIT_REVIEW,
        Permission.CAN_CREATE_COMMENT,
        Permission.CAN_VIEW_MEDIA,
    ],
    "assistant": [
        Permission.CAN_VIEW_COURSE,
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_CREATE_COMMENT,
        Permission.CAN_VIEW_MEDIA,
    ],
    "technician": [
        Permission.CAN_VIEW_COURSE,
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_CREATE_COMMENT,
        Permission.CAN_VIEW_MEDIA,
    ],
}


def get_user_permissions(user: User) -> List[Permission]:
    """Get all permissions for a user based on their role and status."""
    if not user.is_active:
        return []
    
    # Admins and superusers get all permissions
    if user.is_superuser:
        return list(Permission)
    
    # Get permissions for role
    perms = ROLE_PERMISSIONS.get(user.role, [])
    
    # Add basic permissions for all active users
    basic = [
        Permission.CAN_VIEW_CONTENT,
        Permission.CAN_VIEW_MEDIA,
    ]
    
    return list(perms) + basic


def has_permission(user: User, permission: Permission) -> bool:
    """Check if user has specific permission."""
    return permission in get_user_permissions(user)


def require_permission(permission: Permission):
    """Dependency factory to require specific permission."""
    async def dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}"
            )
        return current_user
    return dependency


def require_permissions(permissions: List[Permission]):
    """Dependency factory to require multiple permissions (any of them)."""
    async def dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_perms = get_user_permissions(current_user)
        if not any(p in user_perms for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Any of these permissions required: {[p.value for p in permissions]}"
            )
        return current_user
    return dependency


def require_all_permissions(permissions: List[Permission]):
    """Dependency factory to require ALL permissions."""
    async def dependency(
        current_user: User = Depends(get_current_user)
    ) -> User:
        user_perms = get_user_permissions(current_user)
        if not all(p in user_perms for p in permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"All permissions required: {[p.value for p in permissions]}"
            )
        return current_user
    return dependency


def can_edit_course(user: User, course_author_id: int) -> bool:
    """Check if user can edit a specific course."""
    return (
        user.is_superuser or 
        user.role == "admin" or 
        user.id == course_author_id
    )


def can_view_course(user: Optional[User], course_is_published: bool, course_author_id: int) -> bool:
    """Check if user can view a course."""
    if course_is_published:
        return True
    if user and (user.is_superuser or user.role in ("admin", "teacher")):
        return True
    if user and user.id == course_author_id:
        return True
    return False


def can_view_course_content(user: Optional[User], course_is_published: bool, course_author_id: int) -> bool:
    """Check if user can view course content (requires enrollment or privileged access)."""
    if user and (user.is_superuser or user.role in ("admin", "teacher")):
        return True
    if user and user.id == course_author_id:
        return True
    if course_is_published and user:
        return True
    return False


def check_teacher_or_admin(user: User) -> None:
    """Raise HTTPException if user is not a teacher or admin."""
    if not user.is_superuser and user.role not in ("admin", "teacher"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только преподаватели и администраторы могут выполнять это действие"
        )


def check_admin(user: User) -> None:
    """Raise HTTPException if user is not an admin."""
    if not user.is_superuser and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут выполнять это действие"
        )


def can_manage_quiz(user: User) -> bool:
    """Check if user can manage (create/edit/delete) quizzes."""
    return user.is_superuser or user.role in ("admin", "teacher")


def can_respond_to_review(user: User) -> bool:
    """Check if user can respond to reviews."""
    return user.is_superuser or user.role == "admin"


def can_delete_comment(user: User, comment_author_id: int) -> bool:
    """Check if user can delete a comment."""
    if user.is_superuser or user.role == "admin":
        return True
    return user.id == comment_author_id