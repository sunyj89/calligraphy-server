from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScoreCreate(BaseModel):
    score_type: str
    score: int
    reason: Optional[str] = None


class ScoreResponse(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    score_type: str
    score: int
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreListResponse(BaseModel):
    items: list[ScoreResponse]
    total: int
