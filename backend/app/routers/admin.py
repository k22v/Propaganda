from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import User, Course, Section, Chapter, LessonContent, Enrollment, QuizAttempt, Quiz, Question, Answer
from app.schemas import UserResponse, UpdateUserRole, UpdateUserSpecialization
from app.auth import get_current_active_user
from typing import List, Optional
import json

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(user: User = Depends(get_current_active_user)):
    print(f"DEBUG: require_admin called, user: {user.id}, is_superuser: {user.is_superuser}, role: {user.role}")
    if not user.is_superuser and user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "specialization": u.specialization,
            "role": u.role,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    data: UpdateUserRole,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    print(f"DEBUG: update_user_role called for user {user_id}, new role: '{data.role}'")
    valid_roles = ["student", "teacher", "admin"]
    if data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"DEBUG: Current user role in DB: {user.role}")
    user.role = data.role
    await db.commit()
    await db.refresh(user)
    print(f"DEBUG: User role after refresh: {user.role}")
    return user


@router.patch("/users/{user_id}/specialization")
async def update_user_specialization(
    user_id: int,
    data: UpdateUserSpecialization,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    print(f"DEBUG: update_user_specialization called for user {user_id} with specialization '{data.specialization}'")
    valid_specializations = ["dentist", "assistant", "technician", "clinic_admin"]
    specialization = data.specialization
    if specialization and specialization not in valid_specializations:
        raise HTTPException(status_code=400, detail="Invalid specialization")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.specialization = specialization
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/block")
async def toggle_user_block(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return {"message": f"User {'blocked' if not user.is_active else 'unblocked'}"}


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    users_count = await db.execute(select(func.count(User.id)))
    courses_count = await db.execute(select(func.count(Course.id)))
    enrollments_count = await db.execute(select(func.count(Enrollment.id)))
    
    active_users = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    
    result = await db.execute(
        select(User.specialization, func.count(User.id))
        .group_by(User.specialization)
    )
    by_specialization = {row[0] or "other": row[1] for row in result.all()}
    
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    try:
        enroll_result = await db.execute(
            select(
                func.date(Enrollment.created_at).label("date"),
                func.count(Enrollment.id).label("count")
            )
            .where(Enrollment.created_at >= thirty_days_ago)
            .group_by(func.date(Enrollment.created_at))
            .order_by(func.date(Enrollment.created_at))
        )
        recent_enrollments = [{"date": str(row[0]), "count": row[1]} for row in enroll_result.all()]
    except Exception:
        recent_enrollments = []
    
    return {
        "users": users_count.scalar(),
        "active_users": active_users.scalar(),
        "courses": courses_count.scalar(),
        "enrollments": enrollments_count.scalar(),
        "by_specialization": by_specialization,
        "recent_enrollments": recent_enrollments
    }


@router.get("/quiz-results")
async def get_quiz_results(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(
        select(QuizAttempt, User, Course, Quiz, LessonContent, Chapter, Section)
        .join(Enrollment, QuizAttempt.enrollment_id == Enrollment.id)
        .join(User, Enrollment.user_id == User.id)
        .join(Course, Enrollment.course_id == Course.id)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .join(LessonContent, Quiz.lesson_id == LessonContent.id)
        .join(Chapter, LessonContent.chapter_id == Chapter.id)
        .join(Section, Chapter.section_id == Section.id)
        .order_by(QuizAttempt.completed_at.desc())
    )
    
    rows = result.all()
    
    results = []
    for attempt, user, course, quiz, lesson_content, chapter, section in rows:
        user_answers = json.loads(attempt.answers) if attempt.answers else {}
        
        all_answers_result = await db.execute(
            select(Question, Answer)
            .join(Answer, Question.id == Answer.question_id)
            .where(Question.quiz_id == quiz.id)
        )
        
        all_answers_map = {}
        correct_map = {}
        for q, a in all_answers_result.all():
            if q.id not in all_answers_map:
                all_answers_map[q.id] = {"question_text": q.text, "answers": {}}
            all_answers_map[q.id]["answers"][a.id] = a.text
            if a.is_correct:
                correct_map[q.id] = {"answer_id": a.id, "answer_text": a.text}
        
        question_results = []
        for q_id, a_id in user_answers.items():
            q_id_int = int(q_id)
            a_id_int = int(a_id)
            is_correct = correct_map.get(q_id_int, {}).get("answer_id") == a_id_int
            question_results.append({
                "question_id": q_id_int,
                "question_text": all_answers_map.get(q_id_int, {}).get("question_text", "Неизвестный вопрос"),
                "user_answer_text": all_answers_map.get(q_id_int, {}).get("answers", {}).get(a_id_int, "Неизвестный ответ"),
                "correct_answer_text": correct_map.get(q_id_int, {}).get("answer_text", ""),
                "is_correct": is_correct
            })
        
        results.append({
            "attempt_id": attempt.id,
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "user_name": user.full_name or user.username,
            "user_email": user.email,
            "course_id": course.id,
            "course_title": course.title,
            "section_id": section.id,
            "section_title": section.title,
            "chapter_id": chapter.id,
            "chapter_title": chapter.title,
            "lesson_id": lesson_content.id,
            "lesson_title": lesson_content.title,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "score": attempt.score,
            "passed": attempt.passed,
            "completed_at": attempt.completed_at,
            "question_results": question_results
        })
    
    return results


@router.post("/send-email")
async def send_email_to_users(
    subject: str,
    html_content: str,
    user_filter: str = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    from app.services.email_service import send_email
    
    query = select(User.email).where(User.email.isnot(None))
    
    if user_filter:
        if user_filter == "active":
            query = query.where(User.is_active == True)
        elif user_filter == "inactive":
            query = query.where(User.is_active == False)
        elif user_filter == "dentist":
            query = query.where(User.specialization == "dentist")
        elif user_filter == "assistant":
            query = query.where(User.specialization == "assistant")
    
    result = await db.execute(query)
    emails = [row[0] for row in result.all()]
    
    if not emails:
        return {"message": "No users found", "sent": 0}
    
    sent = await send_email(emails, subject, html_content)
    
    return {"message": f"Email sent to {len(emails)} users", "sent": len(emails) if sent else 0}


@router.post("/send-notification/{user_id}")
async def send_notification(
    user_id: int,
    subject: str,
    message: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    from app.services.email_service import send_email
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.email:
        raise HTTPException(status_code=404, detail="User not found or no email")
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>{subject}</h2>
        <p>{message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">LMS Platform</p>
    </body>
    </html>
    """
    
    sent = await send_email([user.email], subject, html)
    
    return {"message": "Notification sent" if sent else "Failed to send", "email": user.email}
