from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_teacher
from app.models.base import get_db
from app.models.user import Teacher
from app.schemas.score import ScoreCreate, ScoreListResponse, ScoreResponse
from app.services import audit_service, score_service

router = APIRouter(prefix="/api", tags=["scores"])


@router.get("/students/{student_id}/scores", response_model=ScoreListResponse)
async def get_scores(
    student_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    score_type: str | None = Query(None),
    term: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    return await score_service.get_scores(student_id, db, page, page_size, score_type, term)


@router.post("/students/{student_id}/scores", response_model=ScoreResponse)
async def add_score(
    student_id: str,
    score: ScoreCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    record = await score_service.add_score(
        student_id=student_id,
        teacher_id=str(current_teacher.id),
        score_type=score.score_type,
        score=score.score,
        reason=score.reason,
        db=db,
        term=score.term,
        target_part=score.target_part,
        book_id=str(score.book_id) if score.book_id else None,
    )
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="add_score",
        target_type=score.score_type,
        target_id=student_id,
        detail=score.model_dump(mode="json"),
    )
    await db.commit()
    return record


@router.delete("/scores/{score_id}")
async def delete_score(
    score_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    await score_service.delete_score(score_id, db)
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="delete_score",
        target_type="score",
        target_id=score_id,
    )
    await db.commit()
    return {"message": "delete success"}
