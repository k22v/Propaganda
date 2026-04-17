from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
import bcrypt
import secrets
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.database import get_db
from app.models import User, RefreshToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
ACCESS_TOKEN_COOKIE_NAME = "access_token"
COOKIE_SECURE = False  # Set True in production with HTTPS
COOKIE_SAMESITE = "lax"


async def get_token_from_header(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header:
        return auth_header.replace("Bearer ", "")
    
    cookie_token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    
    return ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


async def save_refresh_token(
    db: AsyncSession,
    user_id: int,
    token: str,
    user_agent: str = None,
    ip_address: str = None
) -> RefreshToken:
    token_hash = bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()
    expires_at = datetime.utcnow() + timedelta(days=settings.remember_me_expire_days)
    
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address
    )
    db.add(refresh_token)
    await db.commit()
    await db.refresh(refresh_token)
    return refresh_token


async def verify_refresh_token(
    db: AsyncSession,
    token: str
) -> Optional[User]:
    results = await db.execute(select(RefreshToken).where(RefreshToken.revoked == False))
    tokens = results.scalars().all()
    
    for rt in tokens:
        try:
            if bcrypt.checkpw(token.encode(), rt.token_hash.encode()):
                if rt.expires_at < datetime.utcnow():
                    return None
                result = await db.execute(select(User).where(User.id == rt.user_id))
                return result.scalar_one_or_none()
        except Exception:
            continue
    
    return None


async def revoke_refresh_token(db: AsyncSession, token: str) -> bool:
    results = await db.execute(select(RefreshToken).where(RefreshToken.revoked == False))
    tokens = results.scalars().all()
    
    for rt in tokens:
        try:
            if bcrypt.checkpw(token.encode(), rt.token_hash.encode()):
                rt.revoked = True
                rt.revoked_at = datetime.utcnow()
                await db.commit()
                return True
        except Exception:
            continue
    
    return False


async def revoke_all_user_tokens(db: AsyncSession, user_id: int) -> None:
    results = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        )
    )
    tokens = results.scalars().all()
    for rt in tokens:
        rt.revoked = True
        rt.revoked_at = datetime.utcnow()
    await db.commit()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    token = await get_token_from_header(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return current_user


def can_edit_course(user: User, course_author_id: int) -> bool:
    return user.is_superuser or user.id == course_author_id


def require_roles(allowed_roles: List[str]):
    async def role_checker(user: User = Depends(get_current_active_user)) -> User:
        if not user.is_superuser and user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {allowed_roles}"
            )
        return user
    return role_checker


def require_superuser(user: User = Depends(get_current_active_user)) -> User:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required"
        )
    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    token = await get_token_from_header(request)
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()