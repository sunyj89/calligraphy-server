from pydantic import BaseModel
from typing import Optional, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')


class ResponseBase(BaseModel, Generic[T]):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None


class PageInfo(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
