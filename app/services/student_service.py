from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.student import Student
from app.core.exceptions import NotFoundException
from typing import Optional


async def get_student_by_id(student_id: str, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.id == student_id, Student.is_active == True))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("学员不存在")
    return student


async def list_students(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None
) -> dict:
    query = select(Student).where(Student.is_active == True)
    
    if search:
        query = query.where(Student.name.ilike(f"%{search}%"))
    
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
        "total_pages": (total + page_size - 1) // page_size
    }


async def create_student(data: dict, teacher_id: str, db: AsyncSession) -> Student:
    student = Student(**data, created_by=teacher_id)
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


async def update_student(student_id: str, data: dict, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one()
    
    for key, value in data.items():
        if value is not None:
            setattr(student, key, value)
    
    await db.commit()
    await db.refresh(student)
    return student


async def delete_student(student_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one()
    student.is_active = False
    await db.commit()


async def get_student_statistics(db: AsyncSession) -> dict:
    total_result = await db.execute(select(func.count()).select_from(Student).where(Student.is_active == True))
    total = total_result.scalar()
    
    senior_result = await db.execute(select(func.count()).select_from(Student).where(Student.is_senior == True, Student.is_active == True))
    senior_count = senior_result.scalar()
    
    return {
        "total_students": total,
        "senior_students": senior_count
    }
