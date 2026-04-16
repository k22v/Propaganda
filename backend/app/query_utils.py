"""
Query optimization utilities.

Provides helpers for eager loading to prevent N+1 queries.
"""
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select
from typing import List, Optional, Any


# Eager loading options for common relationships
def with_course_author(query):
    """Add eager loading for course author."""
    return query.options(selectinload(Course.author))


def with_section_chapters(query):
    """Add eager loading for sections -> chapters."""
    return query.options(
        selectinload(Section.chapters)
    )


def with_chapter_contents(query):
    """Add eager loading for chapters -> contents."""
    return query.options(
        selectinload(Chapter.contents)
    )


def with_chapter_quiz(query):
    """Add eager loading for chapters -> quiz."""
    return query.options(
        selectinload(Chapter.quiz)
    )


def with_user_reviews(query):
    """Add eager loading for user reviews."""
    return query.options(
        selectinload(Review.user)
    )


def with_lesson_quiz(query):
    """Add eager loading for lesson -> quiz with questions."""
    return query.options(
        selectinload(LessonContent.quiz).selectinload(Quiz.questions)
    )


def with_enrollment_progress(query):
    """Add eager loading for enrollment -> progress."""
    return query.options(
        selectinload(Enrollment.progress)
    )


def full_course_loader(query):
    """Load full course hierarchy: sections -> chapters -> contents."""
    return query.options(
        selectinload(Course.sections)
        .selectinload(Section.chapters)
        .selectinload(Chapter.contents)
        .selectinload(LessonContent.quiz)
    )


def full_review_loader(query):
    """Load full review with user."""
    return query.options(
        selectinload(Review.user)
    )


def full_comment_loader(query):
    """Load full comment with user."""
    return query.options(
        selectinload(Comment.user)
    )


# Import models for loading
from app.models import Course, Section, Chapter, LessonContent, Review, Comment, Enrollment, Quiz


# Cache configuration
CACHE_TTL = {
    # Short TTL (5 minutes)
    "courses_list": 300,
    "course_detail": 600,
    
    # Medium TTL (15 minutes)
    "user_profile": 900,
    "enrollments": 900,
    
    # Long TTL (1 hour)
    "course_stats": 3600,
    "quiz_results": 3600,
    
    # Very long TTL (24 hours)
    "stats_dashboard": 86400,
}


def get_cache_key(prefix: str, *args) -> str:
    """Generate cache key."""
    return f"{prefix}:{':'.join(map(str, args))}"


# Cache invalidation patterns
CACHE_INVALIDATE_ON = {
    "course_created": ["courses:*", "stats:*"],
    "course_updated": ["course:*", "courses:*"],
    "enrollment_changed": ["enrollment:*", "user:*", "stats:*"],
    "quiz_submitted": ["quiz:*", "stats:*"],
}