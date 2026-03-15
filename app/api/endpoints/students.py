from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_teacher
from app.models.base import get_db
from app.models.user import Teacher
from app.schemas.student import (
    StudentCreate,
    StudentDetailResponse,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)
from app.services import audit_service, student_service

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=StudentListResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    teacher_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    scoped_teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    teacher_filter_id = teacher_id if current_teacher.role == "admin" else None
    return await student_service.list_students(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        teacher_id=scoped_teacher_id,
        teacher_filter_id=teacher_filter_id,
        classroom_id=classroom_id,
    )


@router.post("", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    created = await student_service.create_student(student.model_dump(), str(current_teacher.id), db)
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="create_student",
        target_type="student",
        target_id=str(created.id),
        detail={"name": created.name, "phone": created.phone},
    )
    await db.commit()
    return created


@router.get("/statistics")
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_student_statistics(db, teacher_id)


@router.get("/statistics/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_overview_statistics(db, teacher_id)


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    classroom_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_leaderboard(db, limit, teacher_id, classroom_id)


@router.get("/leaderboard/school")
async def get_school_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    return await student_service.get_school_leaderboard(db, limit)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    student = await student_service.get_student_by_id(student_id, db)
    await student_service.ensure_teacher_can_access_student(student, current_teacher, db)
    return student


@router.get("/{student_id}/detail", response_model=StudentDetailResponse)
async def get_student_detail(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    student = await student_service.get_student_by_id(student_id, db)
    await student_service.ensure_teacher_can_access_student(student, current_teacher, db)
    return await student_service.get_student_detail(student_id, db)


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    updated = await student_service.update_student(student_id, student.model_dump(exclude_unset=True), db)
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="update_student",
        target_type="student",
        target_id=str(updated.id),
        detail=student.model_dump(exclude_unset=True),
    )
    await db.commit()
    return updated


@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    await student_service.delete_student(student_id, db)
    await audit_service.create_log(
        db=db,
        teacher_id=str(current_teacher.id),
        teacher_name=current_teacher.name,
        action="delete_student",
        target_type="student",
        target_id=student_id,
    )
    await db.commit()
    return {"message": "delete success"}
