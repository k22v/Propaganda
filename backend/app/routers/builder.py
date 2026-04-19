from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models_builder import CourseSection, CoursePage, PageBlock, CourseTheme, BlockTemplate, PageRevision
from app.schemas_builder import (
    CourseSectionCreate, CourseSectionUpdate, CourseSectionResponse,
    CoursePageCreate, CoursePageUpdate, CoursePageResponse,
    PageBlockCreate, PageBlockUpdate, PageBlockResponse,
    BuilderTreeResponse, PageBuilderResponse,
    TreeReorderRequest, BlocksReorderRequest, BlockBulkAction,
)
from app.auth import get_current_active_user
from app.models import User
from app.policies import can_edit_course
import json

router = APIRouter(prefix="/builder", tags=["builder"])


async def get_section_or_404(section_id: int, db: AsyncSession):
    result = await db.execute(select(CourseSection).where(CourseSection.id == section_id))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


async def get_page_or_404(page_id: int, db: AsyncSession):
    result = await db.execute(select(CoursePage).where(CoursePage.id == page_id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


async def get_block_or_404(block_id: int, db: AsyncSession):
    result = await db.execute(select(PageBlock).where(PageBlock.id == block_id))
    block = result.scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    return block


@router.get("/courses/{course_id}/tree", response_model=BuilderTreeResponse)
async def get_builder_tree(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    can_edit_course(current_user, course_id, db)

    sections_result = await db.execute(
        select(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.position)
    )
    sections = sections_result.scalars().all()

    pages_result = await db.execute(
        select(CoursePage)
        .join(CourseSection)
        .where(CourseSection.course_id == course_id)
        .order_by(CoursePage.position)
    )
    pages = pages_result.scalars().all()

    return BuilderTreeResponse(
        sections=[CourseSectionResponse.model_validate(s) for s in sections],
        pages=[CoursePageResponse.model_validate(p) for p in pages]
    )


@router.post("/courses/{course_id}/sections", response_model=CourseSectionResponse)
async def create_section(
    course_id: int,
    data: CourseSectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    can_edit_course(current_user, course_id, db)

    max_pos = await db.execute(
        select(CourseSection.position)
        .where(CourseSection.course_id == course_id)
        .order_by(CourseSection.position.desc())
    )
    next_position = (max_pos.scalar_one_or_none() or -1) + 1

    section = CourseSection(
        course_id=course_id,
        title=data.title,
        description=data.description,
        position=next_position
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return CourseSectionResponse.model_validate(section)


@router.patch("/sections/{section_id}", response_model=CourseSectionResponse)
async def update_section(
    section_id: int,
    data: CourseSectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    section = await get_section_or_404(section_id, db)
    can_edit_course(current_user, section.course_id, db)

    if data.title is not None:
        section.title = data.title
    if data.description is not None:
        section.description = data.description
    if data.is_published is not None:
        section.is_published = data.is_published
    if data.position is not None:
        section.position = data.position

    await db.commit()
    await db.refresh(section)
    return CourseSectionResponse.model_validate(section)


@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    section = await get_section_or_404(section_id, db)
    can_edit_course(current_user, section.course_id, db)

    await db.execute(delete(CoursePage).where(CoursePage.section_id == section_id))
    await db.execute(delete(CourseSection).where(CourseSection.id == section_id))
    await db.commit()
    return {"message": "Section deleted"}


@router.post("/courses/{course_id}/pages", response_model=CoursePageResponse)
async def create_page(
    course_id: int,
    data: CoursePageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    section = await get_section_or_404(data.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    max_pos = await db.execute(
        select(CoursePage.position)
        .where(CoursePage.section_id == data.section_id)
        .order_by(CoursePage.position.desc())
    )
    next_position = (max_pos.scalar_one_or_none() or -1) + 1

    page = CoursePage(
        section_id=data.section_id,
        title=data.title,
        page_type=data.page_type,
        theme_id=data.theme_id,
        position=next_position
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return CoursePageResponse.model_validate(page)


@router.patch("/pages/{page_id}", response_model=CoursePageResponse)
async def update_page(
    page_id: int,
    data: CoursePageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    if data.title is not None:
        page.title = data.title
    if data.page_type is not None:
        page.page_type = data.page_type
    if data.is_published is not None:
        page.is_published = data.is_published
    if data.position is not None:
        page.position = data.position
    if data.theme_id is not None:
        page.theme_id = data.theme_id

    await db.commit()
    await db.refresh(page)
    return CoursePageResponse.model_validate(page)


@router.delete("/pages/{page_id}")
async def delete_page(
    page_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    await db.execute(delete(PageBlock).where(PageBlock.page_id == page_id))
    await db.execute(delete(CoursePage).where(CoursePage.id == page_id))
    await db.commit()
    return {"message": "Page deleted"}


@router.patch("/courses/{course_id}/tree/reorder")
async def reorder_tree(
    course_id: int,
    data: TreeReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    can_edit_course(current_user, course_id, db)

    if data.sections:
        for item in data.sections:
            await db.execute(
                update(CourseSection)
                .where(CourseSection.id == item.id)
                .values(position=item.position)
            )

    await db.commit()
    return {"message": "Tree reordered"}


@router.get("/pages/{page_id}/builder", response_model=PageBuilderResponse)
async def get_page_builder(
    page_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    blocks_result = await db.execute(
        select(PageBlock)
        .where(PageBlock.page_id == page_id)
        .order_by(PageBlock.position)
    )
    blocks = blocks_result.scalars().all()

    theme = None
    if page.theme_id:
        theme_result = await db.execute(select(CourseTheme).where(CourseTheme.id == page.theme_id))
        theme = theme_result.scalar_one_or_none()

    return PageBuilderResponse(
        page=CoursePageResponse.model_validate(page),
        blocks=[PageBlockResponse.model_validate(b) for b in blocks],
        theme=CourseThemeResponse.model_validate(theme) if theme else None
    )


@router.post("/pages/{page_id}/blocks", response_model=PageBlockResponse)
async def create_block(
    page_id: int,
    data: PageBlockCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    max_pos = await db.execute(
        select(PageBlock.position)
        .where(PageBlock.page_id == page_id)
        .order_by(PageBlock.position.desc())
    )
    next_position = (max_pos.scalar_one_or_none() or -1) + 1

    block = PageBlock(
        page_id=page_id,
        block_type=data.block_type,
        data_json=data.data_json,
        style_json=data.style_json,
        layout_json=data.layout_json,
        position=data.position if data.position is not None else next_position,
        is_visible=data.is_visible if data.is_visible is not None else True
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return PageBlockResponse.model_validate(block)


@router.patch("/blocks/{block_id}", response_model=PageBlockResponse)
async def update_block(
    block_id: int,
    data: PageBlockUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    block = await get_block_or_404(block_id, db)
    page = await get_page_or_404(block.page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    if data.data_json is not None:
        block.data_json = data.data_json
    if data.style_json is not None:
        block.style_json = data.style_json
    if data.layout_json is not None:
        block.layout_json = data.layout_json
    if data.position is not None:
        block.position = data.position
    if data.is_visible is not None:
        block.is_visible = data.is_visible

    await db.commit()
    await db.refresh(block)
    return PageBlockResponse.model_validate(block)


@router.delete("/blocks/{block_id}")
async def delete_block(
    block_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    block = await get_block_or_404(block_id, db)
    page = await get_page_or_404(block.page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    await db.execute(delete(PageBlock).where(PageBlock.id == block_id))
    await db.commit()
    return {"message": "Block deleted"}


@router.patch("/pages/{page_id}/blocks/reorder")
async def reorder_blocks(
    page_id: int,
    data: BlocksReorderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    for item in data.blocks:
        await db.execute(
            update(PageBlock)
            .where(PageBlock.id == item.id)
            .values(position=item.position)
        )

    await db.commit()
    return {"message": "Blocks reordered"}


@router.patch("/pages/{page_id}/blocks/bulk")
async def bulk_blocks(
    page_id: int,
    data: BlockBulkAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    page = await get_page_or_404(page_id, db)
    section = await get_section_or_404(page.section_id, db)
    can_edit_course(current_user, section.course_id, db)

    if data.action == "delete":
        for block_id in data.block_ids:
            await db.execute(delete(PageBlock).where(PageBlock.id == block_id))
    elif data.action == "toggle_visibility":
        for block_id in data.block_ids:
            block = await get_block_or_404(block_id, db)
            block.is_visible = not block.is_visible

    await db.commit()
    return {"message": "Bulk action completed"}