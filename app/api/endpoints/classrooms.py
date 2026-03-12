from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_teacher
from app.models.base import get_db
from app.models.classroom import Classroom
from app.models.student import Student
from app.models.user import Teacher
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomResponse,
    ClassroomTeacherSummary,
    ClassroomUpdate,
)

router = APIRouter(prefix="/api/classrooms", tags=["classroom-management"])


def _uuid(value: str) -> UUID:
    return UUID(value)


async def _get_teacher_or_404(db: AsyncSession, teacher_id: UUID) -> Teacher:
    result = await db.execute(
        select(Teacher).where(Teacher.id == teacher_id, Teacher.is_active == True)
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="teacher not found")
    return teacher


async def _get_classroom_or_404(db: AsyncSession, classroom_id: str) -> Classroom:
    result = await db.execute(select(Classroom).where(Classroom.id == _uuid(classroom_id)))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="classroom not found")
    return classroom


def _assert_classroom_access(classroom: Classroom, current_teacher: Teacher) -> None:
    if current_teacher.role != "admin" and str(classroom.teacher_id) != str(current_teacher.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")


async def _serialize_classroom(
    db: AsyncSession,
    classroom: Classroom,
    student_count: Optional[int] = None,
) -> dict:
    if student_count is None:
        student_count = (
            await db.execute(
                select(func.count())
                .select_from(Student)
                .where(Student.classroom_id == classroom.id, Student.is_active == True)
            )
        ).scalar()
    teacher = await _get_teacher_or_404(db, classroom.teacher_id)
    payload = ClassroomResponse.model_validate(classroom).model_dump(mode="json")
    payload["student_count"] = student_count
    payload["teacher"] = ClassroomTeacherSummary.model_validate(teacher).model_dump(mode="json")
    return payload


@router.get("")
async def list_classrooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    query = select(Classroom).where(Classroom.is_active == True)
    if current_teacher.role != "admin":
        query = query.where(Classroom.teacher_id == current_teacher.id)
    if search:
        query = query.where(Classroom.name.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    result = await db.execute(
        query.order_by(Classroom.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    classrooms = result.scalars().all()

    items = []
    for classroom in classrooms:
        student_count = (
            await db.execute(
                select(func.count())
                .select_from(Student)
                .where(Student.classroom_id == classroom.id, Student.is_active == True)
            )
        ).scalar()
        items.append(await _serialize_classroom(db, classroom, student_count))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("", response_model=ClassroomResponse)
async def create_classroom(
    data: ClassroomCreate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    teacher_id = current_teacher.id
    if current_teacher.role == "admin" and data.teacher_id is not None:
        teacher_id = data.teacher_id
    await _get_teacher_or_404(db, teacher_id)

    classroom = Classroom(
        name=data.name,
        grade_year=data.grade_year,
        description=data.description,
        teacher_id=teacher_id,
    )
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return await _serialize_classroom(db, classroom)


@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: str,
    data: ClassroomUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    classroom = await _get_classroom_or_404(db, classroom_id)
    _assert_classroom_access(classroom, current_teacher)

    if data.name is not None:
        classroom.name = data.name
    if data.grade_year is not None:
        classroom.grade_year = data.grade_year
    if data.description is not None:
        classroom.description = data.description
    if data.teacher_id is not None:
        if current_teacher.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin required")
        await _get_teacher_or_404(db, data.teacher_id)
        classroom.teacher_id = data.teacher_id

    classroom.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(classroom)
    return await _serialize_classroom(db, classroom)


@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    classroom = await _get_classroom_or_404(db, classroom_id)
    _assert_classroom_access(classroom, current_teacher)
    classroom.is_active = False
    classroom.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "delete success"}


@router.get("/{classroom_id}/students")
async def get_classroom_students(
    classroom_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    classroom = await _get_classroom_or_404(db, classroom_id)
    _assert_classroom_access(classroom, current_teacher)

    query = select(Student).where(Student.classroom_id == classroom.id, Student.is_active == True)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    students = result.scalars().all()

    return {
        "items": students,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/{classroom_id}/students")
async def assign_students_to_classroom(
    classroom_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    classroom = await _get_classroom_or_404(db, classroom_id)
    _assert_classroom_access(classroom, current_teacher)

    student_ids = data.get("student_ids", [])
    count = 0
    for student_id in student_ids:
        result = await db.execute(
            select(Student).where(Student.id == _uuid(student_id), Student.is_active == True)
        )
        student = result.scalar_one_or_none()
        if student:
            student.classroom_id = classroom.id
            count += 1

    await db.commit()
    return {"message": f"assigned {count} students"}


@router.post("/{classroom_id}/students/remove")
async def remove_students_from_classroom(
    classroom_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    classroom = await _get_classroom_or_404(db, classroom_id)
    _assert_classroom_access(classroom, current_teacher)

    student_ids = data.get("student_ids", [])
    count = 0
    for student_id in student_ids:
        result = await db.execute(
            select(Student).where(
                Student.id == _uuid(student_id),
                Student.classroom_id == classroom.id,
                Student.is_active == True,
            )
        )
        student = result.scalar_one_or_none()
        if student:
            student.classroom_id = None
            count += 1

    await db.commit()
    return {"message": f"removed {count} students"}
