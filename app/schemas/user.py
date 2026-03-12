from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class LoginRequest(BaseModel):
    phone: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    teacher: Optional['TeacherResponse'] = None


class TeacherResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    avatar: Optional[str] = None
    role: str
    password_changed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    message: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
