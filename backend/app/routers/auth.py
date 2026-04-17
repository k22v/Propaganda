from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import timedelta
from app.database import get_db
from app.models import User, Enrollment, Review, Course
from app.schemas import UserCreate, UserResponse, Token, UserUpdateAvatar, UserUpdateProfile, PasswordChange
from app.auth import verify_password, get_password_hash, create_access_token, get_current_active_user
from app.config import settings
from app.limiter import limiter
from app.logging_utils import log_activity, get_logger

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
    
    user_id = user.id
    user_username = user.username
    
    await log_activity(
        db=db,
        action="register",
        user_id=user_id,
        details=f"New user registered: {user_username}",
        ip_address=request.client.host if request.client else None
    )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        specialization=user.specialization,
        role=user.role,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        avatar_id=user.avatar_id,
        created_at=user.created_at,
        last_login=user.last_login
    )


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

        from datetime import datetime
        user.last_login = datetime.utcnow()
        await db.commit()

        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=expire_minutes)
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
        logger = get_logger("auth")
        logger.error("login_error", error=str(e))
        raise HTTPException(status_code=500, detail="Login error")


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
    try:
        if data.full_name is not None:
            current_user.full_name = data.full_name
        if data.specialization is not None:
            current_user.specialization = data.specialization
        await db.commit()
        await db.refresh(current_user)
        return current_user
    except Exception as e:
        logger = get_logger("auth")
        logger.error("update_profile_error", error=str(e))
        raise HTTPException(status_code=500, detail="Error updating profile")


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}


@router.post("/change-password")
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Пароль успешно изменён"}


@router.get("/profile-stats")
async def get_profile_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    logger = get_logger("auth")
    
    try:
        courses_count_result = await db.execute(
            select(func.count(Enrollment.id)).where(Enrollment.user_id == current_user.id)
        )
        courses_count = courses_count_result.scalar() or 0
    except Exception as e:
        logger.error("profile_stats_error", operation="courses_count", error=str(e))
        courses_count = 0
    
    try:
        completed_result = await db.execute(
            select(func.count(Enrollment.id)).where(
                Enrollment.user_id == current_user.id,
                Enrollment.completed == True
            )
        )
        completed_count = completed_result.scalar() or 0
    except Exception as e:
        logger.error("profile_stats_error", operation="completed_count", error=str(e))
        completed_count = 0
    
    try:
        reviews_count_result = await db.execute(
            select(func.count(Review.id)).where(Review.user_id == current_user.id)
        )
        reviews_count = reviews_count_result.scalar() or 0
    except Exception as e:
        logger.error("profile_stats_error", operation="reviews_count", error=str(e))
        reviews_count = 0
    
    try:
        reviews_result = await db.execute(
            select(Review, Course.title)
            .join(Course, Review.course_id == Course.id)
            .where(Review.user_id == current_user.id)
            .order_by(Review.created_at.desc())
            .limit(10)
        )
        
        reviews = []
        for row in reviews_result.all():
            review, course_title = row
            reviews.append({
                "id": review.id,
                "rating": review.rating,
                "text": review.comment,
                "created_at": review.created_at.isoformat() if review.created_at else None,
                "course_title": course_title
            })
    except Exception as e:
        logger.error("profile_stats_error", operation="reviews", error=str(e))
        reviews = []
    
    return {
        "courses_count": courses_count,
        "completed_count": completed_count,
        "reviews_count": reviews_count,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "reviews": reviews
    }
