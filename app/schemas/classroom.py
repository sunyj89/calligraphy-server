from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClassroomCreate(BaseModel):
    name: str
    grade_year: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[UUID] = None


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    grade_year: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[UUID] = None


class ClassroomTeacherSummary(BaseModel):
    id: UUID
    name: str
    phone: str

    model_config = ConfigDict(from_attributes=True)


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
    teacher: Optional[ClassroomTeacherSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ClassroomListResponse(BaseModel):
    items: list[ClassroomResponse]
    total: int
    page: int
    page_size: int
