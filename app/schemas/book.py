from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class BookCreate(BaseModel):
    name: str
    cover: Optional[str] = None
    description: Optional[str] = None
    order_num: int = 0


class BookUpdate(BaseModel):
    name: Optional[str] = None
    cover: Optional[str] = None
    description: Optional[str] = None
    order_num: Optional[int] = None


class BookResponse(BaseModel):
    id: UUID
    name: str
    cover: Optional[str] = None
    description: Optional[str] = None
    order_num: int = 0
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class BookListResponse(BaseModel):
    items: list[BookResponse]
    total: int
