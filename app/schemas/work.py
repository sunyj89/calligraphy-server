from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class WorkCreate(BaseModel):
    book_id: Optional[UUID] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    term: Literal["spring", "summer", "autumn"]
    slot_index: int = Field(..., ge=1, le=2)
    gallery_scope: Literal["classroom", "school", "both"] = "classroom"
    score: int = Field(..., ge=0, le=100)


class WorkResponse(BaseModel):
    id: UUID
    student_id: UUID
    teacher_id: UUID
    book_id: Optional[UUID] = None
    term: str
    slot_index: int
    gallery_scope: str
    image_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    score: int
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WorkListResponse(BaseModel):
    items: list[WorkResponse]
    total: int
