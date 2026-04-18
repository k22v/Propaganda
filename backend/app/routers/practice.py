from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import random
from app.database import get_db
from app.models import PracticeQuestion, Course, Enrollment
from app.schemas import PracticeQuestionCreate, PracticeQuestionUpdate, PracticeQuestionResponse
from app.auth import get_current_active_user, get_current_user_optional
from app.models import User
from app.policies import can_edit_course

router = APIRouter(prefix="/practice", tags=["practice"])


async def check_practice_access(course_id: int, current_user: Optional[User], db: AsyncSession):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.is_superuser or current_user.role == 'admin':
        return course

    if course.author_id == current_user.id:
        return course

    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    )
    if enrollment_result.scalar_one_or_none():
        return course

    raise HTTPException(status_code=403, detail="No access to this course practice")


@router.get("/course/{course_id}", response_model=List[PracticeQuestionResponse])
async def list_practice_questions(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    await check_practice_access(course_id, current_user, db)
    
    result = await db.execute(
        select(PracticeQuestion)
        .where(PracticeQuestion.course_id == course_id)
        .where(PracticeQuestion.is_active == True)
        .order_by(PracticeQuestion.created_at)
    )
    return result.scalars().all()


@router.get("/course/{course_id}/random")
async def get_random_question(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    await check_practice_access(course_id, current_user, db)
    
    result = await db.execute(
        select(PracticeQuestion)
        .where(PracticeQuestion.course_id == course_id)
        .where(PracticeQuestion.is_active == True)
    )
    questions = result.scalars().all()
    
    if not questions:
        raise HTTPException(status_code=404, detail="No practice questions found for this course")
    
    random_question = random.choice(questions)
    return random_question


@router.post("/", response_model=PracticeQuestionResponse)
async def create_practice_question(
    question_data: PracticeQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    course_result = await db.execute(
        select(Course).where(Course.id == question_data.course_id)
    )
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Only course author can add practice questions")
    
    question = PracticeQuestion(**question_data.model_dump())
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


@router.patch("/{question_id}", response_model=PracticeQuestionResponse)
async def update_practice_question(
    question_id: int,
    question_data: PracticeQuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(PracticeQuestion).where(PracticeQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    course_result = await db.execute(
        select(Course).where(Course.id == question.course_id)
    )
    course = course_result.scalar_one_or_none()
    
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Only course author can edit questions")
    
    for key, value in question_data.model_dump(exclude_unset=True).items():
        setattr(question, key, value)
    
    await db.commit()
    await db.refresh(question)
    return question


@router.delete("/{question_id}")
async def delete_practice_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(PracticeQuestion).where(PracticeQuestion.id == question_id)
    )
    question = result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    course_result = await db.execute(
        select(Course).where(Course.id == question.course_id)
    )
    course = course_result.scalar_one_or_none()
    
    if not can_edit_course(current_user, course.author_id):
        raise HTTPException(status_code=403, detail="Only course author can delete questions")
    
    await db.delete(question)
    await db.commit()
    return {"message": "Question deleted"}