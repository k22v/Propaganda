from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Literal


BlockTypeLiteral = Literal["text", "image", "video", "quiz", "divider", "quote", "list"]
PageTypeLiteral = Literal["longread", "quiz"]


class CourseSectionCreate(BaseModel):
    title: str
    description: Optional[str] = None


class CourseSectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None
    position: Optional[int] = None


class CourseSectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: Optional[str]
    is_published: bool
    position: int
    created_at: datetime
    updated_at: datetime


class CoursePageCreate(BaseModel):
    section_id: int
    title: str
    page_type: PageTypeLiteral = "longread"
    theme_id: Optional[int] = None


class CoursePageUpdate(BaseModel):
    title: Optional[str] = None
    page_type: Optional[PageTypeLiteral] = None
    is_published: Optional[bool] = None
    position: Optional[int] = None
    theme_id: Optional[int] = None


class CoursePageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section_id: int
    title: str
    page_type: str
    is_published: bool
    position: int
    theme_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class PageBlockCreate(BaseModel):
    page_id: int
    block_type: BlockTypeLiteral
    data_json: Optional[str] = None
    style_json: Optional[str] = None
    layout_json: Optional[str] = None
    position: Optional[int] = None
    is_visible: Optional[bool] = True


class PageBlockUpdate(BaseModel):
    data_json: Optional[str] = None
    style_json: Optional[str] = None
    layout_json: Optional[str] = None
    position: Optional[int] = None
    is_visible: Optional[bool] = None


class PageBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    page_id: int
    block_type: str
    data_json: Optional[str]
    style_json: Optional[str]
    layout_json: Optional[str]
    position: int
    is_visible: bool
    created_at: datetime
    updated_at: datetime


class CourseThemeCreate(BaseModel):
    name: str
    theme_json: Optional[str] = None
    is_default: Optional[bool] = False


class CourseThemeUpdate(BaseModel):
    name: Optional[str] = None
    theme_json: Optional[str] = None
    is_default: Optional[bool] = None


class CourseThemeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    name: str
    theme_json: Optional[str]
    is_default: bool
    created_at: datetime
    updated_at: datetime


class BlockTemplateCreate(BaseModel):
    name: str
    category: BlockTypeLiteral
    block_type: BlockTypeLiteral
    data_json: Optional[str] = None
    style_json: Optional[str] = None
    layout_json: Optional[str] = None
    is_public: Optional[bool] = False


class BlockTemplateUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None
    usage_count: Optional[int] = None


class BlockTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_id: Optional[int]
    name: str
    category: str
    block_type: str
    data_json: Optional[str]
    style_json: Optional[str]
    layout_json: Optional[str]
    is_public: bool
    usage_count: int
    created_at: datetime


class PageRevisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    page_id: int
    version: int
    blocks_snapshot: Optional[str]
    created_by: Optional[int]
    created_at: datetime


class BuilderTreeResponse(BaseModel):
    sections: List[CourseSectionResponse]
    pages: List[CoursePageResponse]


class PageBuilderResponse(BaseModel):
    page: CoursePageResponse
    blocks: List[PageBlockResponse]
    theme: Optional[CourseThemeResponse] = None


class TreeReorderItem(BaseModel):
    id: int
    position: int


class TreeReorderRequest(BaseModel):
    sections: Optional[List[TreeReorderItem]] = None


class BlocksReorderRequest(BaseModel):
    blocks: List[TreeReorderItem]


class BlockBulkAction(BaseModel):
    action: Literal["delete", "toggle_visibility", "duplicate"]
    block_ids: List[int]


class PageBulkAction(BaseModel):
    action: Literal["delete", "toggle_visibility"]
    page_ids: List[int]