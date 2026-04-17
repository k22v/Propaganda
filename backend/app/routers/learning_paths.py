from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
import secrets

from app.database import get_db
from app.models import User, LearningPath, LearningPathCourse, Certificate, Course, Enrollment
from app.schemas import (
    LearningPathCreate, LearningPathUpdate, LearningPathResponse,
    LearningPathCourseCreate, LearningPathCourseResponse,
    CertificateResponse, CertificateVerify
)
from app.auth import get_current_active_user
from app.policies import check_teacher_or_admin, check_admin

router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])


@router.get("/", response_model=List[LearningPathResponse])
async def list_learning_paths(
    specialization: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(LearningPath).where(LearningPath.is_published == True)
    
    if specialization:
        query = query.where(LearningPath.specialization == specialization)
    
    query = query.options(selectinload(LearningPath.courses).selectinload(LearningPathCourse.course))
    result = await db.execute(query.order_by(LearningPath.order))
    return result.scalars().all()


@router.get("/{path_id}", response_model=LearningPathResponse)
async def get_learning_path(
    path_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(LearningPath)
        .where(LearningPath.id == path_id)
        .options(selectinload(LearningPath.courses).selectinload(LearningPathCourse.course))
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path


@router.post("/", response_model=LearningPathResponse)
async def create_learning_path(
    data: LearningPathCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    check_teacher_or_admin(current_user)
    
    path = LearningPath(
        title=data.title,
        description=data.description,
        specialization=data.specialization,
        target_role=data.target_role,
        is_published=data.is_published,
        order=data.order
    )
    db.add(path)
    await db.commit()
    await db.refresh(path)
    return path


@router.put("/{path_id}/courses", response_model=LearningPathResponse)
async def update_path_courses(
    path_id: int,
    courses: List[LearningPathCourseCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    check_teacher_or_admin(current_user)
    
    result = await db.execute(
        select(LearningPath).where(LearningPath.id == path_id)
    )
    path = result.scalar_one_or_none()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    await db.execute(
        LearningPathCourse.__table__.delete().where(LearningPathCourse.learning_path_id == path_id)
    )
    
    for i, course_data in enumerate(courses):
        result = await db.execute(select(Course).where(Course.id == course_data.course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail=f"Course {course_data.course_id} not found")
        
        path_course = LearningPathCourse(
            learning_path_id=path_id,
            course_id=course_data.course_id,
            order=course_data.order or i,
            is_required=course_data.is_required
        )
        db.add(path_course)
    
    await db.commit()
    
    result = await db.execute(
        select(LearningPath)
        .where(LearningPath.id == path_id)
        .options(selectinload(LearningPath.courses).selectinload(LearningPathCourse.course))
    )
    return result.scalar_one()


certificate_router = APIRouter(prefix="/certificates", tags=["certificates"])


@certificate_router.get("/my", response_model=List[CertificateResponse])
async def get_my_certificates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == current_user.id)
        .options(selectinload(Certificate.course))
        .order_by(Certificate.issued_at.desc())
    )
    return result.scalars().all()


@certificate_router.get("/verify", response_model=CertificateResponse)
async def verify_certificate(
    data: CertificateVerify,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Certificate)
        .where(Certificate.verification_code == data.verification_code)
        .options(selectinload(Certificate.course), selectinload(Certificate.user))
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@certificate_router.post("/issue", response_model=CertificateResponse)
async def issue_certificate(
    course_id: int,
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    check_admin(current_user)
    
    target_user_id = user_id or current_user.id
    
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == target_user_id,
            Enrollment.course_id == course_id,
            Enrollment.completed == True
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=400, detail="User has not completed this course")
    
    result = await db.execute(
        select(Certificate).where(
            Certificate.user_id == target_user_id,
            Certificate.course_id == course_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    
    cert_number = f"CERT-{uuid.uuid4().hex[:8].upper()}"
    verify_code = secrets.token_urlsafe(16)
    
    cert = Certificate(
        user_id=target_user_id,
        course_id=course_id,
        certificate_number=cert_number,
        verification_code=verify_code,
        ce_credits=2.0
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    
    result = await db.execute(
        select(Certificate)
        .where(Certificate.id == cert.id)
        .options(selectinload(Certificate.course), selectinload(Certificate.user))
    )
    return result.scalar_one()
