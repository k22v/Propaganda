from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, Token, UserUpdateAvatar, UserUpdateProfile, PasswordChange
from app.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.config import settings
from app.limiter import limiter
from app.logging_utils import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        specialization=user_data.specialization,
        role="student",
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    await log_activity(
        db=db,
        action="register",
        user_id=user.id,
        details=f"New user registered: {user.username}",
        ip_address=request.client.host if request.client else None
    )
    
    return user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(User).where(User.username == form_data.username))
        user = result.scalar_one_or_none()

        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ваш аккаунт заблокирован. Свяжитесь с администратором.",
            )

        remember_me = "remember_me" in (form_data.scopes or [])
        expire_minutes = settings.remember_me_expire_days * 24 * 60 if remember_me else settings.access_token_expire_minutes

        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=expire_minutes)
        )
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=expire_minutes * 60,
            samesite="lax"
        )
        
        await log_activity(
            db=db,
            action="login",
            user_id=user.id,
            details=f"User {user.username} logged in",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        await log_activity(
            db=db,
            action="login_failed",
            details=f"Failed login attempt for {form_data.username}",
            ip_address=request.client.host if request.client else None
        )
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/avatar", response_model=UserResponse)
async def update_avatar(
    data: UserUpdateAvatar,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.avatar_id = data.avatar_id
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserUpdateProfile,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.specialization is not None:
        current_user.specialization = data.specialization
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Пароль успешно изменён"}
