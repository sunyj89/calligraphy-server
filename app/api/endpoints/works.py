from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_teacher
from app.models.base import get_db
from app.models.user import Teacher
from app.schemas.work import WorkCreate, WorkListResponse, WorkResponse
from app.services import audit_service, work_service

router = APIRouter(prefix="/api", tags=["works"])


@router.get("/students/{student_id}/works", response_model=WorkListResponse)
async def get_works(
    student_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    term: str | None = Query(None),
    gallery_scope: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    return await work_service.get_works(student_id, db, page, page_size, term, gallery_scope)


@router.post("/students/{student_id}/works", response_model=WorkResponse)
async def create_or_replace_work(
    student_id: str,
    work: WorkCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    record = await work_service.create_or_replace_work(
        student_id=student_id,
        teacher_id=str(current_teacher.id),
        data=work.model_dump(),
        db=db,
    )
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="upsert_work",
        target_type="work",
        target_id=str(record.id),
        detail=work.model_dump(mode="json"),
    )
    await db.commit()
    return record


@router.get("/works/{work_id}", response_model=WorkResponse)
async def get_work_detail(
    work_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    return await work_service.get_work_detail(work_id, db)


@router.delete("/works/{work_id}")
async def delete_work(
    work_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    await work_service.delete_work(work_id, db)
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="delete_work",
        target_type="work",
        target_id=work_id,
    )
    await db.commit()
    return {"message": "delete success"}
