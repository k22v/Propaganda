from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
import json
from datetime import datetime
from app.database import get_db
from app.models import User, Course, Section, Chapter, LessonContent, Enrollment, Quiz, Question, Answer, QuizAttempt, LessonProgress
from app.schemas import (
    QuizCreate, QuizUpdate, QuizResponse, QuizWithQuestionsResponse, 
    QuestionResponse, AnswerResponse,
    QuizAttemptCreate, QuizAttemptResponse
)
from app.auth import get_current_active_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("/", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_superuser and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Только администраторы могут создавать тесты")
    
    result = await db.execute(
        select(LessonContent).where(LessonContent.id == quiz_data.lesson_id).options(selectinload(LessonContent.chapter).selectinload(Chapter.section))
    )
    lesson_content = result.scalar_one_or_none()
    if not lesson_content:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = lesson_content.chapter.section.course_id

    result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to create quiz for this lesson")

    quiz = Quiz(
        lesson_id=quiz_data.lesson_id,
        title=quiz_data.title,
        description=quiz_data.description,
        passing_score=quiz_data.passing_score
    )
    db.add(quiz)
    await db.flush()

    for q_data in quiz_data.questions:
        question = Question(
            quiz_id=quiz.id,
            text=q_data.text,
            order=q_data.order
        )
        db.add(question)
        await db.flush()

        for a_data in q_data.answers:
            answer = Answer(
                question_id=question.id,
                text=a_data.text,
                is_correct=a_data.is_correct,
                order=a_data.order
            )
            db.add(answer)

    await db.commit()
    await db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions).selectinload(Question.answers))
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return {
        "id": quiz.id,
        "lesson_id": quiz.lesson_id,
        "title": quiz.title,
        "description": quiz.description,
        "passing_score": quiz.passing_score,
        "created_at": quiz.created_at,
        "questions": [
            {
                "id": q.id,
                "quiz_id": q.id,
                "text": q.text,
                "order": q.order,
                "answers": [
                    {"id": a.id, "question_id": a.question_id, "text": a.text, "is_correct": a.is_correct, "order": a.order}
                    for a in q.answers
                ]
            }
            for q in quiz.questions
        ]
    }


@router.get("/lesson/{lesson_id}")
async def get_quiz_by_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).where(Quiz.lesson_id == lesson_id).options(selectinload(Quiz.questions).selectinload(Question.answers))
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found for this lesson")
    
    return {
        "id": quiz.id,
        "lesson_id": quiz.lesson_id,
        "title": quiz.title,
        "description": quiz.description,
        "passing_score": quiz.passing_score,
        "created_at": quiz.created_at,
        "questions": [
            {
                "id": q.id,
                "quiz_id": q.id,
                "text": q.text,
                "order": q.order,
                "answers": [
                    {"id": a.id, "question_id": a.question_id, "text": a.text, "is_correct": a.is_correct, "order": a.order}
                    for a in q.answers
                ]
            }
            for q in quiz.questions
        ]
    }


@router.get("/{quiz_id}/attempts/history")
async def get_attempts_history(
    quiz_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    result = await db.execute(
        select(LessonContent).where(LessonContent.id == quiz.lesson_id).options(selectinload(LessonContent.chapter).selectinload(Chapter.section))
    )
    lesson_content = result.scalar_one_or_none()
    course_id = lesson_content.chapter.section.course_id
    
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled")
    
    result = await db.execute(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.enrollment_id == enrollment.id
        ).order_by(QuizAttempt.started_at.desc())
    )
    attempts = result.scalars().all()
    
    attempts_data = []
    for attempt in attempts:
        attempt_dict = {
            "id": attempt.id,
            "score": attempt.score,
            "passed": attempt.passed,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at
        }
        if quiz.show_correct_answers:
            attempt_dict["answers"] = json.loads(attempt.answers) if attempt.answers else {}
        attempts_data.append(attempt_dict)
    
    return {
        "attempts": attempts_data,
        "max_attempts": quiz.max_attempts,
        "can_attempt": quiz.max_attempts is None or len(attempts) < quiz.max_attempts
    }


@router.post("/{quiz_id}/attempt", response_model=QuizAttemptResponse)
@limiter.limit("10/minute")
async def submit_quiz_attempt(
    quiz_id: int,
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    result = await db.execute(
        select(LessonContent).where(LessonContent.id == quiz.lesson_id).options(selectinload(LessonContent.chapter).selectinload(Chapter.section))
    )
    lesson_content = result.scalar_one_or_none()
    if not lesson_content:
        raise HTTPException(status_code=404, detail="Lesson content not found")

    course_id = lesson_content.chapter.section.course_id

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    if quiz.max_attempts:
        result = await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.enrollment_id == enrollment.id
            )
        )
        attempt_count = len(result.scalars().all())
        if attempt_count >= quiz.max_attempts:
            raise HTTPException(
                status_code=403, 
                detail=f"Достигнут лимит попыток ({quiz.max_attempts}). Попробуйте позже или обратитесь к администратору."
            )

    result = await db.execute(
        select(Answer).where(Answer.is_correct == True)
    )
    correct_answers = {a.question_id: a.id for a in result.scalars().all()}

    score = 0
    total_questions = len(attempt_data.answers)
    for question_id, answer_id in attempt_data.answers.items():
        if correct_answers.get(question_id) == answer_id:
            score += 1

    final_score = int((score / total_questions) * 100) if total_questions > 0 else 0
    passed = final_score >= quiz.passing_score

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        enrollment_id=enrollment.id,
        score=final_score,
        passed=passed,
        answers=json.dumps(attempt_data.answers),
        completed_at=datetime.utcnow()
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    return attempt


@router.get("/attempt/{quiz_id}/best", response_model=QuizAttemptResponse)
async def get_best_attempt(
    quiz_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    result = await db.execute(
        select(LessonContent).where(LessonContent.id == quiz.lesson_id).options(selectinload(LessonContent.chapter).selectinload(Chapter.section))
    )
    lesson_content = result.scalar_one_or_none()
    if not lesson_content:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course_id = lesson_content.chapter.section.course_id

    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled")

    result = await db.execute(
        select(QuizAttempt).where(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.enrollment_id == enrollment.id
        ).order_by(QuizAttempt.score.desc())
    )
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempts yet")
    return attempt
