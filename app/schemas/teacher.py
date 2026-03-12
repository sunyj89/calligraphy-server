from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class TeacherCreate(BaseModel):
    name: str
    phone: str
    password: str = "123456"
    role: str = "teacher"


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None


class TeacherResetPassword(BaseModel):
    new_password: str = "123456"


class TeacherListResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
