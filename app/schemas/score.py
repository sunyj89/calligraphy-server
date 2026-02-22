from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ScoreCreate(BaseModel):
    score_type: str
    score: int
    reason: Optional[str] = None


class ScoreResponse(BaseModel):
    id: UUID
    student_id: UUID
    teacher_id: UUID
    score_type: str
    score: int
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreListResponse(BaseModel):
    items: list[ScoreResponse]
    total: int
