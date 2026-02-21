from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
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

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    items: list[StudentResponse]
    total: int
    page: int
    page_size: int
