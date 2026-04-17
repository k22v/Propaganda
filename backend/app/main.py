from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi import Depends
from app.database import init_db, get_db
from app.sanitize import CSP_POLICY, HSTS_HEADER
from app.routers import auth, courses, quizzes
from app.routers.templates import router as templates_router
from app.routers.instruments import router as instruments_router
from app.routers.admin import router as admin_router
from app.routers.practice import router as practice_router
from app.routers.comments import router as comments_router
from app.routers.reviews import router as reviews_router
from app.routers.notifications import router as notifications_router
from app.routers.learning_paths import router as learning_paths_router, certificate_router
from app.limiter import limiter
from app.sentry_config import init_sentry
from app.logging_utils import configure_logging
import os
import logging
import asyncio

configure_logging()
init_sentry()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LMS Platform API",
    description="Платформа для создания и прохождения онлайн-курсов",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(instruments_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(learning_paths_router, prefix="/api")
app.include_router(certificate_router, prefix="/api")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://pdv:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # CSP
        response.headers["Content-Security-Policy"] = CSP_POLICY
        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"
        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"
        # Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # HSTS
        response.headers["Strict-Transport-Security"] = HSTS_HEADER
        return response


app.add_middleware(SecurityHeadersMiddleware)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
async def root():
    return {"message": "LMS Platform API", "status": "running"}


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(select(1))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    redis_status = "not_configured"
    try:
        from app.services.cache_service import get_redis_client
        redis = get_redis_client()
        if redis:
            await redis.ping()
            redis_status = "healthy"
    except Exception:
        pass
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "redis": redis_status
    }
