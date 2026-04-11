from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import os
import uuid
from app.database import get_db
from app.models import Instrument
from app.schemas import InstrumentCreate, InstrumentUpdate, InstrumentResponse
from app.auth import get_current_active_user
from app.models import User

router = APIRouter(prefix="/instruments", tags=["instruments"])

UPLOAD_DIR = "uploads/instruments"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[InstrumentResponse])
async def list_instruments(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Instrument)
    
    if current_user.is_superuser:
        if category:
            query = query.where(Instrument.category == category)
        if specialization:
            query = query.where(Instrument.specialization == specialization)
    else:
        user_spec = current_user.specialization
        query = query.where(Instrument.specialization == user_spec)
        if category:
            query = query.where(Instrument.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (Instrument.name.ilike(search_term)) |
            (Instrument.name_en.ilike(search_term)) |
            (Instrument.description.ilike(search_term))
        )
    
    query = query.offset(skip).limit(limit).order_by(Instrument.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Instrument.category).where(Instrument.category.isnot(None)).distinct()
    result = await db.execute(query)
    categories = [row[0] for row in result.fetchall() if row[0]]
    return categories


@router.get("/{instrument_id}", response_model=InstrumentResponse)
async def get_instrument(
    instrument_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Instrument).where(Instrument.id == instrument_id)
    )
    instrument = result.scalar_one_or_none()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    return instrument


def require_superuser(user: User = Depends(get_current_active_user)):
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Only superuser can add instruments")
    return user


@router.post("/", response_model=InstrumentResponse)
async def create_instrument(
    instrument_data: InstrumentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser)
):
    instrument = Instrument(**instrument_data.model_dump())
    db.add(instrument)
    await db.commit()
    await db.refresh(instrument)
    return instrument


@router.patch("/{instrument_id}", response_model=InstrumentResponse)
async def update_instrument(
    instrument_id: int,
    instrument_data: InstrumentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser)
):
    result = await db.execute(
        select(Instrument).where(Instrument.id == instrument_id)
    )
    instrument = result.scalar_one_or_none()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    for key, value in instrument_data.model_dump(exclude_unset=True).items():
        setattr(instrument, key, value)
    
    await db.commit()
    await db.refresh(instrument)
    return instrument


@router.delete("/{instrument_id}")
async def delete_instrument(
    instrument_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_superuser)
):
    result = await db.execute(
        select(Instrument).where(Instrument.id == instrument_id)
    )
    instrument = result.scalar_one_or_none()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrument not found")
    
    await db.delete(instrument)
    await db.commit()
    return {"message": "Instrument deleted"}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_superuser)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    return {"url": f"/{filepath}"}