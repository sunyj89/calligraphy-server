from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class ScoreCreate(BaseModel):
    score_type: Literal["practice", "homework", "competition"]
    score: int = Field(..., ge=0)
    reason: Optional[str] = None
    term: Literal["spring", "summer", "autumn"]
    target_part: Optional[Literal["root", "trunk"]] = None
    book_id: Optional[UUID] = None


class ScoreResponse(BaseModel):
    id: UUID
    student_id: UUID
    teacher_id: UUID
    score_type: str
    score: int  # applied score
    raw_score: Optional[int] = None
    multiplier: Optional[int] = None
    term: Optional[str] = None
    target_part: Optional[str] = None
    book_id: Optional[UUID] = None
    work_id: Optional[UUID] = None
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScoreListResponse(BaseModel):
    items: list[ScoreResponse]
    total: int
