from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
from app.schemas.score import ScoreCreate, ScoreResponse, ScoreListResponse
from app.services import score_service

router = APIRouter(prefix="/api", tags=["积分管理"])


@router.get("/students/{student_id}/scores", response_model=ScoreListResponse)
async def get_scores(
    student_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await score_service.get_scores(student_id, db, page, page_size)


@router.post("/students/{student_id}/scores", response_model=ScoreResponse)
async def add_score(
    student_id: str,
    score: ScoreCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await score_service.add_score(
        student_id,
        str(current_teacher.id),
        score.score_type,
        score.score,
        score.reason,
        db
    )


@router.delete("/scores/{score_id}")
async def delete_score(
    score_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    await score_service.delete_score(score_id, db)
    return {"message": "撤销成功"}
