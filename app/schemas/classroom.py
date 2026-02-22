from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime


class ClassroomCreate(BaseModel):
    name: str
    grade_year: Optional[str] = None
    description: Optional[str] = None


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    grade_year: Optional[str] = None
    description: Optional[str] = None


class ClassroomResponse(BaseModel):
    id: UUID
    name: str
    grade_year: Optional[str] = None
    description: Optional[str] = None
    teacher_id: UUID
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    student_count: Optional[int] = None

    class Config:
        from_attributes = True


class ClassroomListResponse(BaseModel):
    items: list[ClassroomResponse]
    total: int
    page: int
    page_size: int
