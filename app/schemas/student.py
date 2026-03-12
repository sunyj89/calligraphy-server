from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class StudentCreate(BaseModel):
    name: str
    phone: str = Field(..., min_length=11, max_length=11)
    password: str = Field(..., min_length=6, max_length=50)
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: str
    gender: str
    birthday: Optional[str] = None
    classroom_id: Optional[UUID] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=50)
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    classroom_id: Optional[UUID] = None


class StudentResponse(BaseModel):
    id: UUID
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    classroom_id: Optional[UUID] = None
    total_score: int = 0
    root_score: int = 0
    trunk_score: int = 0
    leaf_count: int = 0
    fruit_count: int = 0
    stage: str = 'sprout'
    is_senior: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    items: list[StudentResponse]
    total: int
    page: int
    page_size: int
