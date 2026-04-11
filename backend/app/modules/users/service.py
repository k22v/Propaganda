from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.repository import UserRepository
from app.schemas import UserCreate, UserResponse
from app.auth import verify_password
from typing import Optional, List
from fastapi import HTTPException, status


class UserService:
    def __init__(self, db: AsyncSession):
        self.repository = UserRepository(db)

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        existing = await self.repository.get_by_email(user_data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        existing = await self.repository.get_by_username(user_data.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

        user = await self.repository.create(user_data)
        return UserResponse.model_validate(user)

    async def get_user(self, user_id: int) -> Optional[UserResponse]:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(user)

    async def get_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        users = await self.repository.get_all(skip=skip, limit=limit)
        return [UserResponse.model_validate(u) for u in users]

    async def update_user(self, user_id: int, **kwargs) -> UserResponse:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated = await self.repository.update(user, **kwargs)
        return UserResponse.model_validate(updated)

    async def update_specialization(self, user_id: int, specialization: str) -> UserResponse:
        valid_specializations = ['dentist', 'assistant', 'technician', 'clinic_admin']
        if specialization not in valid_specializations:
            raise HTTPException(status_code=400, detail=f"Invalid specialization. Must be one of: {valid_specializations}")

        user = await self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        updated = await self.repository.update(user, specialization=specialization)
        return UserResponse.model_validate(updated)

    async def delete_user(self, user_id: int) -> None:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await self.repository.delete(user)

    async def authenticate(self, username: str, password: str) -> Optional[UserResponse]:
        user = await self.repository.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return UserResponse.model_validate(user)
