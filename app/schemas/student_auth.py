from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StudentLoginRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    password: str = Field(..., min_length=6, max_length=50)


class SmsCodeRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)


class StudentSmsLoginRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    code: str = Field(..., min_length=6, max_length=6)


class StudentRegisterRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=11)
    code: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6, max_length=50)
    name: str = Field(..., min_length=1, max_length=50)


class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str = Field(..., min_length=6, max_length=50)


class ChangePhoneRequest(BaseModel):
    new_phone: str = Field(..., min_length=11, max_length=11)
    code: str = Field(..., min_length=6, max_length=6)


class StudentAuthResponse(BaseModel):
    id: str
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
    classroom_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
