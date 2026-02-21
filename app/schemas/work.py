from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WorkCreate(BaseModel):
    book_id: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None


class WorkResponse(BaseModel):
    id: str
    student_id: str
    book_id: Optional[str] = None
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
