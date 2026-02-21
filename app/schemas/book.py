from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BookResponse(BaseModel):
    id: str
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
