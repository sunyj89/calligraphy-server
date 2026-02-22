from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class WorkCreate(BaseModel):
    book_id: Optional[UUID] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None


class WorkResponse(BaseModel):
    id: UUID
    student_id: UUID
    book_id: Optional[UUID] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class WorkListResponse(BaseModel):
    items: list[WorkResponse]
    total: int
