from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timedelta

from app.models import User
from app.auth import verify_password, get_password_hash, create_access_token
from app.policies import get_user_permissions, Permission
from fastapi import HTTPException, status


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate user by username/password."""
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        return user

    async def create_token(self, user: User, expires_delta: Optional[timedelta] = None) -> str:
        """Create access token for user."""
        return create_access_token(
            data={"sub": str(user.id)},
            expires_delta=expires_delta
        )

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def check_permission(self, user: User, permission: Permission) -> bool:
        """Check if user has specific permission."""
        return permission in get_user_permissions(user)

    async def register_user(
        self,
        email: str,
        username: str,
        password: str,
        full_name: Optional[str] = None,
        specialization: Optional[str] = None
    ) -> User:
        """Register new user."""
        # Check email exists
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Check username exists
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )
        
        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            specialization=specialization,
            role="student"
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def change_password(
        self,
        user: User,
        old_password: str,
        new_password: str
    ) -> None:
        """Change user password."""
        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=400,
                detail="Incorrect password"
            )
        
        user.hashed_password = get_password_hash(new_password)
        await self.db.commit()

    async def deactivate_user(self, user_id: int) -> None:
        """Deactivate user account."""
        user = await self.get_user_by_id(user_id)
        if user:
            user.is_active = False
            await self.db.commit()

    async def activate_user(self, user_id: int) -> None:
        """Activate user account."""
        user = await self.get_user_by_id(user_id)
        if user:
            user.is_active = True
            await self.db.commit()

    async def update_last_login(self, user: User) -> None:
        """Update user's last login timestamp."""
        user.last_login = datetime.utcnow()
        await self.db.commit()