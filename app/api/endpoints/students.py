from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.services import student_service

router = APIRouter(prefix="/api/students", tags=["学员管理"])


@router.get("", response_model=StudentListResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.list_students(db, page, page_size, search, teacher_id, classroom_id)


@router.post("", response_model=StudentResponse)
async def create_student(
    student: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await student_service.create_student(student.model_dump(), str(current_teacher.id), db)


@router.get("/statistics")
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_student_statistics(db, teacher_id)


@router.get("/statistics/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_overview_statistics(db, teacher_id)


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    classroom_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    teacher_id = None if current_teacher.role == "admin" else str(current_teacher.id)
    return await student_service.get_leaderboard(db, limit, teacher_id, classroom_id)


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await student_service.get_student_by_id(student_id, db)


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await student_service.update_student(student_id, student.model_dump(exclude_unset=True), db)


@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    await student_service.delete_student(student_id, db)
    return {"message": "删除成功"}
