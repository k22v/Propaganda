from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models import Template, User
from app.schemas import TemplateResponse, TemplateCreate, TemplateUpdate
from app.auth import get_current_active_user

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Template).order_by(Template.is_default.desc(), Template.title))
    templates = result.scalars().all()
    return templates


@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    db_template = Template(
        title=template.title,
        content=template.content,
        is_default=False
    )
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await db.execute(select(Template).where(Template.id == template_id))
    db_template = result.scalar_one_or_none()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    db_template.title = template.title
    db_template.content = template.content
    await db.commit()
    await db.refresh(db_template)
    return db_template


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Нет доступа")
    
    result = await db.execute(select(Template).where(Template.id == template_id))
    db_template = result.scalar_one_or_none()
    if not db_template:
        raise HTTPException(status_code=404, detail="Шаблон не найден")
    
    await db.delete(db_template)
    await db.commit()
    return {"message": "Шаблон удалён"}
