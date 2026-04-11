from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Literal
import re

ContentTypeLiteral = Literal["text", "quote", "image", "list", "interactive", "video", "separator", "file", "quiz", "xray_case", "model_3d", "dental_image"]


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    specialization: Optional[str] = None  # dentist, assistant, technician
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username должен содержать минимум 3 символа')
        if len(v) > 30:
            raise ValueError('Username должен содержать максимум 30 символов')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username может содержать только латинские буквы, цифры и _')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Пароль должен содержать минимум 6 символов')
        return v


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, response_model_by_alias=True)

    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    role: str = "student"
    is_active: bool = True
    is_superuser: bool = False
    avatar_id: Optional[int] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    specialization: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Название курса не может быть пустым')
        if len(v) > 200:
            raise ValueError('Название курса слишком длинное (максимум 200 символов)')
        return v.strip()


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None
    specialization: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    is_published: bool = False
    specialization: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0


class SectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None


class SectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: Optional[str]
    order: int
    created_at: datetime
    chapters_count: Optional[int] = 0


class ChapterCreate(BaseModel):
    section_id: int
    title: str
    description: Optional[str] = None
    order: int = 0


class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    section_id: Optional[int] = None


class ChapterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section_id: int
    title: str
    description: Optional[str]
    order: int
    created_at: datetime
    contents_count: Optional[int] = 0


class LessonContentCreate(BaseModel):
    chapter_id: int
    title: str
    content_type: ContentTypeLiteral = "text"
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    model_url: Optional[str] = None  # для 3D-моделей
    xray_image: Optional[str] = None  # для рентгенов
    hotspots_data: Optional[str] = None  # JSON с точками
    duration: Optional[int] = None
    order: int = 0


class LessonContentUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[ContentTypeLiteral] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    file_url: Optional[str] = None
    model_url: Optional[str] = None
    xray_image: Optional[str] = None
    hotspots_data: Optional[str] = None
    duration: Optional[int] = None
    order: Optional[int] = None
    chapter_id: Optional[int] = None


class LessonContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chapter_id: int
    title: str
    content_type: ContentTypeLiteral
    content: Optional[str]
    video_url: Optional[str]
    file_url: Optional[str]
    model_url: Optional[str] = None
    xray_image: Optional[str] = None
    hotspots_data: Optional[str] = None
    duration: Optional[int]
    order: int
    created_at: datetime
    has_quiz: bool = False


class ChapterWithContents(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    contents: List[LessonContentResponse] = []


class SectionWithChapters(BaseModel):
    id: int
    title: str
    description: Optional[str]
    order: int
    chapters: List[ChapterWithContents] = []


class CourseStructureResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: int
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None
    author_id: int
    is_published: bool = False
    sections: List[SectionWithChapters] = []


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_content_id: int
    is_completed: bool
    completed_at: Optional[datetime]


class AnswerCreate(BaseModel):
    text: str
    is_correct: bool = False
    order: int = 0
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Текст ответа не может быть пустым')
        return v.strip()


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_id: int
    text: str
    is_correct: bool
    order: int


class QuestionCreate(BaseModel):
    text: str
    question_type: str = "single"  # single, multiple, xray_hotspot
    image_url: Optional[str] = None
    hotspots_json: Optional[str] = None
    order: int = 0
    answers: List[AnswerCreate]


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    text: str
    question_type: str
    image_url: Optional[str]
    hotspots_json: Optional[str]
    order: int
    answers: List[AnswerResponse] = []


class QuizCreate(BaseModel):
    lesson_content_id: int
    title: str
    description: Optional[str] = None
    passing_score: int = 70
    max_attempts: Optional[int] = None
    show_correct_answers: bool = True
    questions: List[QuestionCreate]


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    passing_score: Optional[int] = None
    max_attempts: Optional[int] = None
    show_correct_answers: Optional[bool] = None


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_content_id: int
    title: str
    description: Optional[str]
    passing_score: int
    max_attempts: Optional[int] = None
    show_correct_answers: bool = True
    created_at: datetime
    questions_count: Optional[int] = 0


class QuizWithQuestionsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_content_id: int
    title: str
    description: Optional[str]
    passing_score: int
    questions: List[QuestionResponse]


class QuizAttemptCreate(BaseModel):
    answers: dict[int, int]


class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    enrollment_id: int
    score: Optional[int]
    passed: bool
    started_at: datetime
    completed_at: Optional[datetime]


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    enrollment_id: int
    certificate_number: str
    issued_at: datetime
    course_title: str
    user_name: str


class ReorderItem(BaseModel):
    id: int
    order: int


class ReorderRequest(BaseModel):
    items: List[ReorderItem]


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, response_model_by_alias=True)
    
    id: int
    title: str
    content: str
    is_default: bool
    created_at: datetime
    updated_at: datetime


class TemplateCreate(BaseModel):
    title: str
    content: str


class TemplateUpdate(BaseModel):
    title: str
    content: str


class CommentCreate(BaseModel):
    content: str
    lesson_id: int
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, response_model_by_alias=True)
    
    id: int
    lesson_id: int
    user_id: int
    content: str
    parent_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[UserResponse] = None


class UserUpdateAvatar(BaseModel):
    avatar_id: int


class UserUpdateProfile(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class InstrumentBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    specialization: Optional[str] = None
    image_url: Optional[str] = None
    how_to_pack: Optional[str] = None
    sterilization_method: Optional[str] = None
    autoclave_temp: Optional[str] = None
    autoclave_time: Optional[str] = None
    autoclave_pressure: Optional[str] = None
    notes: Optional[str] = None
    video_url: Optional[str] = None


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    how_to_pack: Optional[str] = None
    sterilization_method: Optional[str] = None
    autoclave_temp: Optional[str] = None
    autoclave_time: Optional[str] = None
    autoclave_pressure: Optional[str] = None
    notes: Optional[str] = None
    video_url: Optional[str] = None


class InstrumentResponse(InstrumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PracticeQuestionBase(BaseModel):
    question_text: str
    question_type: Optional[str] = "text"
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    answer_hint: Optional[str] = None
    explanation: Optional[str] = None


class PracticeQuestionCreate(PracticeQuestionBase):
    course_id: int


class PracticeQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    answer_hint: Optional[str] = None
    explanation: Optional[str] = None
    is_active: Optional[bool] = None


class PracticeQuestionResponse(PracticeQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    is_active: bool
    created_at: datetime


class ReviewCreate(BaseModel):
    course_id: int
    rating: int
    comment: Optional[str] = None
    
    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[UserResponse] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None
    
    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v
