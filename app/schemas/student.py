from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date, datetime
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
    birthday: Optional[date] = None
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
    birthday: Optional[date] = None
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
    birthday: Optional[date] = None
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


class StudentTeacherSummary(BaseModel):
    id: UUID
    name: str
    phone: str


class StudentClassroomSummary(BaseModel):
    id: UUID
    name: str
    grade_year: Optional[str] = None


class StudentGrowthRecord(BaseModel):
    id: UUID
    score_type: str
    score: int
    raw_score: Optional[int] = None
    term: Optional[str] = None
    target_part: Optional[str] = None
    book_id: Optional[UUID] = None
    work_id: Optional[UUID] = None
    reason: Optional[str] = None
    created_at: Optional[datetime] = None


class StudentGrowthDetailResponse(BaseModel):
    items: list[StudentGrowthRecord]
    total: int


class StudentWorkRecord(BaseModel):
    id: UUID
    term: str
    slot_index: int
    gallery_scope: str
    image_url: str
    description: Optional[str] = None
    score: int
    created_at: Optional[datetime] = None


class StudentWorkDetailResponse(BaseModel):
    items: list[StudentWorkRecord]
    total: int


class StudentDetailCore(BaseModel):
    id: UUID
    name: str
    phone: str
    avatar: Optional[str] = None
    school: Optional[str] = None
    grade: str
    gender: str
    birthday: Optional[date] = None
    total_score: int
    stage: str
    is_senior: bool


class StudentDetailResponse(BaseModel):
    student: StudentDetailCore
    classroom: Optional[StudentClassroomSummary] = None
    teacher: Optional[StudentTeacherSummary] = None
    growth_detail: StudentGrowthDetailResponse
    works: StudentWorkDetailResponse
