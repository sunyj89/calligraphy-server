from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.base import get_db
from app.api.dependencies import get_current_teacher, get_current_admin
from app.models.user import Teacher
from app.models.classroom import Classroom
from app.models.student import Student
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomResponse
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/api/classrooms", tags=["班级管理"])


@router.get("")
async def list_classrooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    query = select(Classroom).where(Classroom.is_active == True)

    # 普通教师只能看自己的班级
    if current_teacher.role != "admin":
        query = query.where(Classroom.teacher_id == current_teacher.id)

    if search:
        query = query.where(Classroom.name.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Classroom.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    classrooms = result.scalars().all()

    # 统计每个班级的学生数
    items = []
    for c in classrooms:
        student_count_result = await db.execute(
            select(func.count()).select_from(Student).where(
                Student.classroom_id == c.id,
                Student.is_active == True
            )
        )
        student_count = student_count_result.scalar()
        item = ClassroomResponse.model_validate(c).model_dump(mode="json")
        item["student_count"] = student_count
        items.append(item)

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
    classroom = Classroom(
        name=data.name,
        grade_year=data.grade_year,
        description=data.description,
        teacher_id=current_teacher.id,
    )
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    return classroom


@router.put("/{classroom_id}", response_model=ClassroomResponse)
async def update_classroom(
    classroom_id: str,
    data: ClassroomUpdate,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    result = await db.execute(select(Classroom).where(Classroom.id == classroom_id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    # 非 admin 只能编辑自己的班级
    if current_teacher.role != "admin" and str(classroom.teacher_id) != str(current_teacher.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此班级")

    if data.name is not None:
        classroom.name = data.name
    if data.grade_year is not None:
        classroom.grade_year = data.grade_year
    if data.description is not None:
        classroom.description = data.description

    classroom.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(classroom)
    return classroom


@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    result = await db.execute(select(Classroom).where(Classroom.id == classroom_id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    if current_teacher.role != "admin" and str(classroom.teacher_id) != str(current_teacher.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此班级")

    classroom.is_active = False
    classroom.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "已删除"}


@router.get("/{classroom_id}/students")
async def get_classroom_students(
    classroom_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    # 验证班级存在
    result = await db.execute(select(Classroom).where(Classroom.id == classroom_id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    query = select(Student).where(Student.classroom_id == classroom_id, Student.is_active == True)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
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
    """批量分配学生到班级。data: {"student_ids": ["id1", "id2", ...]}"""
    result = await db.execute(select(Classroom).where(Classroom.id == classroom_id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    if current_teacher.role != "admin" and str(classroom.teacher_id) != str(current_teacher.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此班级")

    student_ids = data.get("student_ids", [])
    count = 0
    for sid in student_ids:
        res = await db.execute(select(Student).where(Student.id == sid, Student.is_active == True))
        student = res.scalar_one_or_none()
        if student:
            student.classroom_id = classroom.id
            count += 1

    await db.commit()
    return {"message": f"已分配 {count} 名学生到班级"}


@router.post("/{classroom_id}/students/remove")
async def remove_students_from_classroom(
    classroom_id: str,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    """从班级移除学生。data: {"student_ids": ["id1", "id2", ...]}"""
    result = await db.execute(select(Classroom).where(Classroom.id == classroom_id))
    classroom = result.scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="班级不存在")

    if current_teacher.role != "admin" and str(classroom.teacher_id) != str(current_teacher.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权操作此班级")

    student_ids = data.get("student_ids", [])
    count = 0
    for sid in student_ids:
        res = await db.execute(
            select(Student).where(Student.id == sid, Student.classroom_id == classroom.id)
        )
        student = res.scalar_one_or_none()
        if student:
            student.classroom_id = None
            count += 1

    await db.commit()
    return {"message": f"已从班级移除 {count} 名学生"}
