from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Integer, JSON, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import Optional, List


class Base(DeclarativeBase):
    pass


class CourseSection(Base):
    __tablename__ = "course_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('ix_course_sections_course_position', 'course_id', 'position'),
    )


class CoursePage(Base):
    __tablename__ = "course_pages"

    id: Mapped[int] = mapped_column(primary_key=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("course_sections.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    page_type: Mapped[str] = mapped_column(String(50), default="longread")  # longread, quiz
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    theme_id: Mapped[Optional[int]] = mapped_column(ForeignKey("course_themes.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('ix_course_pages_section_position', 'section_id', 'position'),
    )


class PageBlock(Base):
    __tablename__ = "page_blocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("course_pages.id"), index=True)
    block_type: Mapped[str] = mapped_column(String(50))  # text, image, video, quiz, divider
    data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON text content
    style_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON style properties
    layout_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON layout (width, offset, etc.)
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('ix_page_blocks_page_position', 'page_id', 'position'),
    )


class CourseTheme(Base):
    __tablename__ = "course_themes"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    theme_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON theme properties
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)  # null = system template
    name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str] = mapped_column(String(50))  # text, image, video, quiz, divider, quote, list
    block_type: Mapped[str] = mapped_column(String(50))
    data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    style_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    layout_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PageRevision(Base):
    __tablename__ = "page_revisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("course_pages.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    blocks_snapshot: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON snapshot of blocks
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_page_revisions_page_version', 'page_id', 'version'),
    )