from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models import User, Review, Course, Enrollment
from app.schemas import ReviewCreate, ReviewResponse, ReviewUpdate
from app.auth import get_current_active_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/course/{course_id}", response_model=List[ReviewResponse])
async def get_course_reviews(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    print(f"=== GET reviews for course {course_id} ===")
    try:
        result = await db.execute(
            select(Review).where(Review.course_id == course_id)
            .options(selectinload(Review.user))
            .order_by(Review.created_at.desc())
        )
        reviews = list(result.scalars().all())
        print(f"Reviews found: {len(reviews)}")
        
        return reviews
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/course/{course_id}/stats")
async def get_course_review_stats(
    course_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(
                func.count(Review.id).label("count"),
                func.avg(Review.rating).label("average")
            ).where(Review.course_id == course_id)
        )
        stats = result.one()
        
        return {
            "count": stats.count or 0,
            "average": round(stats.average, 1) if stats.average else 0
        }
    except Exception as e:
        print(f"Error loading review stats: {e}")
        return {"count": 0, "average": 0}


@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Course).where(Course.id == review_data.course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == review_data.course_id
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Вы должны быть записаны на курс")
    
    result = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.course_id == review_data.course_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Вы уже оставляли отзыв")
    
    review = Review(
        user_id=current_user.id,
        course_id=review_data.course_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    
    from app.schemas import UserResponse
    user_response = UserResponse.model_validate(current_user)
    
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        course_id=review.course_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
        user=user_response
    )


@router.put("/{review_id}", response_model=ReviewResponse)
@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Не авторизованы")
    
    if review_data.rating is not None:
        review.rating = review_data.rating
    if review_data.comment is not None:
        review.comment = review_data.comment
    
    await db.commit()
    await db.refresh(review)
    
    from app.schemas import UserResponse
    user_response = UserResponse.model_validate(current_user)
    
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        course_id=review.course_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
        user=user_response
    )


@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    if review.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Не авторизованы")
    
    await db.delete(review)
    await db.commit()
    
    return {"message": "Отзыв удалён"}


@router.post("/{review_id}/respond", response_model=ReviewResponse)
async def respond_to_review(
    review_id: int,
    response_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Только администратор может отвечать на отзывы")
    
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    from datetime import datetime
    review.admin_response = response_data.get("response", "")
    review.admin_response_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(review)
    
    return review


@router.get("/my")
async def get_my_reviews(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Review)
        .options(selectinload(Review.user))
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    
    reviews_data = []
    for r in reviews:
        review_dict = {
            "id": r.id,
            "user_id": r.user_id,
            "course_id": r.course_id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "user": {
                "id": r.user.id,
                "username": r.user.username,
                "full_name": r.user.full_name,
                "avatar_id": r.user.avatar_id
            } if r.user else None
        }
        reviews_data.append(review_dict)
    
    return reviews_data
