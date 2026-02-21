from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
from app.schemas.work import WorkCreate, WorkResponse, WorkListResponse
from app.services import work_service

router = APIRouter(prefix="/api", tags=["作品管理"])


@router.get("/students/{student_id}/works", response_model=WorkListResponse)
async def get_works(
    student_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await work_service.get_works(student_id, db, page, page_size)


@router.post("/students/{student_id}/works", response_model=WorkResponse)
async def create_work(
    student_id: str,
    work: WorkCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await work_service.create_work(student_id, work.model_dump(), db)


@router.delete("/works/{work_id}")
async def delete_work(
    work_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    await work_service.delete_work(work_id, db)
    return {"message": "删除成功"}
