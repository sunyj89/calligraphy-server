from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class StudentLoginRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    password: str = Field(..., min_length=6, max_length=50)


class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str = Field(..., min_length=6, max_length=50)


class StudentAuthResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    avatar: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    total_score: int
    root_score: int
    trunk_score: int
    leaf_count: int
    fruit_count: int
    stage: str
    is_senior: bool
    classroom_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
