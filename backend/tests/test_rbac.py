import pytest
from app.policies import (
    Permission,
    get_user_permissions,
    has_permission,
    can_edit_course,
    can_view_course,
    can_manage_quiz,
    can_respond_to_review,
    can_delete_comment,
    check_teacher_or_admin,
    check_admin,
)
from app.models import User


@pytest.mark.asyncio
async def test_student_permissions():
    user = User(
        id=1,
        role="student",
        is_active=True,
        is_superuser=False
    )
    perms = get_user_permissions(user)
    
    assert Permission.CAN_VIEW_COURSE in perms
    assert Permission.CAN_VIEW_QUIZ in perms
    assert Permission.CAN_CREATE_REVIEW in perms
    assert Permission.CAN_CREATE_COMMENT in perms
    assert Permission.CAN_CREATE_COURSE not in perms
    assert Permission.CAN_VIEW_ADMIN not in perms


@pytest.mark.asyncio
async def test_teacher_permissions():
    user = User(
        id=1,
        role="teacher",
        is_active=True,
        is_superuser=False
    )
    perms = get_user_permissions(user)
    
    assert Permission.CAN_VIEW_COURSE in perms
    assert Permission.CAN_CREATE_COURSE in perms
    assert Permission.CAN_EDIT_COURSE in perms
    assert Permission.CAN_PUBLISH_COURSE in perms
    assert Permission.CAN_CREATE_QUIZ in perms
    assert Permission.CAN_VIEW_ADMIN not in perms


@pytest.mark.asyncio
async def test_admin_permissions():
    user = User(
        id=1,
        role="admin",
        is_active=True,
        is_superuser=False
    )
    perms = get_user_permissions(user)
    
    assert Permission.CAN_VIEW_COURSE in perms
    assert Permission.CAN_CREATE_COURSE in perms
    assert Permission.CAN_VIEW_ADMIN in perms
    assert Permission.CAN_EDIT_USER in perms
    assert Permission.CAN_DELETE_USER in perms
    assert Permission.CAN_VIEW_STATS in perms


@pytest.mark.asyncio
async def test_superuser_permissions():
    user = User(
        id=1,
        role="student",
        is_active=True,
        is_superuser=True
    )
    perms = get_user_permissions(user)
    
    assert Permission.CAN_VIEW_COURSE in perms
    assert Permission.CAN_CREATE_COURSE in perms
    assert Permission.CAN_VIEW_ADMIN in perms
    assert Permission.CAN_EDIT_USER in perms
    assert Permission.CAN_DELETE_USER in perms
    assert len(perms) == len(list(Permission))


@pytest.mark.asyncio
async def test_inactive_user_no_permissions():
    user = User(
        id=1,
        role="admin",
        is_active=False,
        is_superuser=False
    )
    perms = get_user_permissions(user)
    
    assert len(perms) == 0


@pytest.mark.asyncio
async def test_can_edit_course_own():
    user = User(id=1, role="teacher", is_superuser=False)
    assert can_edit_course(user, course_author_id=1) is True


@pytest.mark.asyncio
async def test_cannot_edit_others_course():
    user = User(id=1, role="teacher", is_superuser=False)
    assert can_edit_course(user, course_author_id=2) is False


@pytest.mark.asyncio
async def test_admin_can_edit_any_course():
    user = User(id=1, role="admin", is_superuser=False)
    assert can_edit_course(user, course_author_id=999) is True


@pytest.mark.asyncio
async def test_superuser_can_edit_any_course():
    user = User(id=1, role="student", is_superuser=True)
    assert can_edit_course(user, course_author_id=999) is True


@pytest.mark.asyncio
async def test_can_view_published_course():
    user = User(id=1, role="student", is_superuser=False)
    assert can_view_course(user, course_is_published=True, course_author_id=999) is True


@pytest.mark.asyncio
async def test_cannot_view_unpublished_course():
    user = User(id=1, role="student", is_superuser=False)
    assert can_view_course(user, course_is_published=False, course_author_id=999) is False


@pytest.mark.asyncio
async def test_author_can_view_own_course():
    user = User(id=1, role="student", is_superuser=False)
    assert can_view_course(user, course_is_published=False, course_author_id=1) is True


@pytest.mark.asyncio
async def test_teacher_can_view_unpublished_course():
    user = User(id=1, role="teacher", is_superuser=False)
    assert can_view_course(user, course_is_published=False, course_author_id=2) is True


@pytest.mark.asyncio
async def test_can_manage_quiz_teacher():
    user = User(id=1, role="teacher", is_superuser=False)
    assert can_manage_quiz(user) is True


@pytest.mark.asyncio
async def test_cannot_manage_quiz_student():
    user = User(id=1, role="student", is_superuser=False)
    assert can_manage_quiz(user) is False


@pytest.mark.asyncio
async def test_can_respond_to_review_admin():
    user = User(id=1, role="admin", is_superuser=False)
    assert can_respond_to_review(user) is True


@pytest.mark.asyncio
async def test_cannot_respond_to_review_teacher():
    user = User(id=1, role="teacher", is_superuser=False)
    assert can_respond_to_review(user) is False


@pytest.mark.asyncio
async def test_can_delete_own_comment():
    user = User(id=1, role="student", is_superuser=False)
    assert can_delete_comment(user, comment_author_id=1) is True


@pytest.mark.asyncio
async def test_cannot_delete_others_comment():
    user = User(id=1, role="student", is_superuser=False)
    assert can_delete_comment(user, comment_author_id=2) is False


@pytest.mark.asyncio
async def test_admin_can_delete_any_comment():
    user = User(id=1, role="admin", is_superuser=False)
    assert can_delete_comment(user, comment_author_id=999) is True


@pytest.mark.asyncio
async def test_check_teacher_or_admin_teacher():
    user = User(id=1, role="teacher", is_superuser=False)
    check_teacher_or_admin(user)


@pytest.mark.asyncio
async def test_check_teacher_or_admin_student_raises():
    from fastapi import HTTPException
    user = User(id=1, role="student", is_superuser=False)
    with pytest.raises(HTTPException) as exc_info:
        check_teacher_or_admin(user)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_check_admin_admin():
    user = User(id=1, role="admin", is_superuser=False)
    check_admin(user)


@pytest.mark.asyncio
async def test_check_admin_teacher_raises():
    from fastapi import HTTPException
    user = User(id=1, role="teacher", is_superuser=False)
    with pytest.raises(HTTPException) as exc_info:
        check_admin(user)
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_has_permission():
    user = User(id=1, role="teacher", is_active=True, is_superuser=False)
    assert has_permission(user, Permission.CAN_CREATE_COURSE) is True
    assert has_permission(user, Permission.CAN_DELETE_USER) is False
