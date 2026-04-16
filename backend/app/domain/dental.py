"""
Dental domain models and schemas.

This module defines dental-specific domain models for the LMS.
"""
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class DentalSpecialization(str, Enum):
    """Dental specialization tracks."""
    DENTIST = "dentist"           # Врач-стоматолог
    ASSISTANT = "assistant"       # Ассистент стоматолога
    TECHNICIAN = "technician"    # Зубной техник
    Hygienist = "hygienist"      # Гигиенист стоматологический
    SURGEON = "surgeon"        # Челюстно-лицевой хирург
    ORTHODONTIST = "orthodontist"  # Ортодонт
    PERIODONTIST = "periodontist"   # Пародонтолог
    THERAPIST = "therapist"     # Терапевт
    PROSTHODONTIST = "prosthodontist"  # Ортопед


class CourseTrack(str, Enum):
    """Course tracks for different specializations."""
    GENERAL = "general"              # Общий курс
    DENTIST_ADVANCED = "dentist_advanced"  # Для врачей
    ASSISTANT_BASIC = "assistant_basic"      # Для ассистентов
    TECHNICIAN_ADVANCED = "technician_advanced"  # Для техников
    CE_CREDITS = "ce_credits"        # Continuing Education кредиты


class CertificateType(str, Enum):
    """Types of certificates."""
    COMPLETION = "completion"      # Certificate of completion
    CE_CREDIT = "ce_credit"       # CE credit certificate
    PROFICIENCY = "proficiency"   # Certificate of proficiency
    SPECIALIST = "specialist"     # Specialist certificate


# Course requirements for each specialization
SPECIALIZATION_COURSES = {
    DentalSpecialization.DENTIST: [
        "Основы стоматологии",
        "Эндодонтия",
        "Ортопедическая стоматология",
        "Хирургическая стоматология",
        "Пародонтология",
    ],
    DentalSpecialization.ASSISTANT: [
        "Основы работы ассистента",
        "Стерилизация и дезинфекция",
        "Работа с оборудованием",
        "Коммуникация с пациентами",
    ],
    DentalSpecialization.TECHNICIAN: [
        "Основы зуботехнического дела",
        "Изготовление протезов",
        "Ортопедические конструкции",
        "Материаловедение",
    ],
}


# CE credit requirements per year
CE_CREDITS_REQUIRED = {
    DentalSpecialization.DENTIST: 50,
    DentalSpecialization.ASSISTANT: 30,
    DentalSpecialization.TECHNICIAN: 40,
    DentalSpecialization.Hygienist: 35,
}


class CourseRequirement(BaseModel):
    """Course requirement for completion."""
    course_id: int
    is_mandatory: bool = False
    min_score: int = 70


class DentalCourseMetadata(BaseModel):
    """Dental-specific course metadata."""
    specialization: Optional[DentalSpecialization] = None
    track: CourseTrack = CourseTrack.GENERAL
    
    # CE credits
    ce_credits: int = 0
    ce_valid_until: Optional[datetime] = None
    
    # Requirements
    required_courses: List[CourseRequirement] = []
    
    # Target audience
    target_audience: List[str] = []
    
    # Learning outcomes
    learning_outcomes: List[str] = []
    
    # Prerequisites
    prerequisites: List[int] = []


# Certificate schema
class Certificate(BaseModel):
    """Certificate model."""
    id: int
    user_id: int
    course_id: int
    certificate_type: CertificateType
    issued_at: datetime
    expires_at: Optional[datetime] = None
    
    # CE credits
    ce_credits: int = 0
    
    # Verification code
    verification_code: str
    
    # Metadata
    course_name: str
    user_name: str


# Skills matrix for specializations
DENTAL_SKILLS = {
    DentalSpecialization.DENTIST: [
        "Диагностика стоматологических заболеваний",
        "Лечение кариеса",
        "Эндодонтическое лечение",
        "Удаление зубов",
        "Протезирование",
        "Имплантация",
    ],
    DentalSpecialization.ASSISTANT: [
        "Ассистирование при лечении",
        "Стерилизация инструментов",
        "Подготовка рабочего места",
        "Работа с рентгеном",
        "Ведение документации",
    ],
    DentalSpecialization.TECHNICIAN: [
        "Изготовление коронок",
        "Изготовление протезов",
        "Изготовление виниров",
        "Работа с керамикой",
        "Работа с металлами",
    ],
}


def get_specialization_requirements(specialization: DentalSpecialization) -> List[str]:
    """Get required courses for a specialization."""
    return SPECIALIZATION_COURSES.get(specialization, [])


def get_skills(specialization: DentalSpecialization) -> List[str]:
    """Get skills matrix for a specialization."""
    return DENTAL_SKILLS.get(specialization, [])