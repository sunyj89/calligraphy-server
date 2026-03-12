from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.core.security import hash_password
from app.models.classroom import Classroom
from app.models.score_record import ScoreRecord
from app.models.student import Student
from app.models.user import Teacher


def _uuid(value: str) -> UUID:
    return UUID(value)


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except ValueError as exc:
        raise BadRequestException("birthday must be ISO date: YYYY-MM-DD") from exc


async def get_student_by_id(student_id: str, db: AsyncSession) -> Student:
    result = await db.execute(
        select(Student).where(Student.id == _uuid(student_id), Student.is_active == True)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("student not found")
    return student


async def list_students(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    teacher_id: Optional[str] = None,
    classroom_id: Optional[str] = None,
) -> dict:
    query = select(Student).where(Student.is_active == True)

    if teacher_id:
        query = query.where(Student.created_by == _uuid(teacher_id))

    if classroom_id:
        query = query.where(Student.classroom_id == _uuid(classroom_id))

    if search:
        query = query.where(
            Student.name.ilike(f"%{search}%") | Student.phone.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    rows = await db.execute(
        query.order_by(Student.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    students = rows.scalars().all()
    return {
        "items": students,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


async def create_student(data: dict, teacher_id: str, db: AsyncSession) -> Student:
    existing = await db.execute(select(Student).where(Student.phone == data["phone"]))
    if existing.scalar_one_or_none():
        raise BadRequestException("phone already exists")

    student = Student(
        name=data["name"],
        phone=data["phone"],
        password_hash=hash_password(data["password"]),
        avatar=data.get("avatar"),
        address=data.get("address"),
        school=data.get("school"),
        grade=data.get("grade"),
        gender=data.get("gender"),
        birthday=_parse_date(data.get("birthday")),
        classroom_id=data.get("classroom_id"),
        created_by=_uuid(teacher_id),
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


async def update_student(student_id: str, data: dict, db: AsyncSession) -> Student:
    student = await get_student_by_id(student_id, db)

    password = data.pop("password", None)
    birthday = data.pop("birthday", None) if "birthday" in data else None
    classroom_id = data.pop("classroom_id", None) if "classroom_id" in data else None

    for key, value in data.items():
        if value is not None:
            setattr(student, key, value)

    if birthday is not None:
        student.birthday = _parse_date(birthday)

    if classroom_id is not None:
        student.classroom_id = classroom_id

    if password:
        student.password_hash = hash_password(password)
        student.password_changed_at = datetime.now(timezone.utc)

    student.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(student)
    return student


async def delete_student(student_id: str, db: AsyncSession) -> None:
    student = await get_student_by_id(student_id, db)
    student.is_active = False
    student.updated_at = datetime.now(timezone.utc)
    await db.commit()


async def get_student_statistics(db: AsyncSession, teacher_id: Optional[str] = None) -> dict:
    filters = [Student.is_active == True]
    if teacher_id:
        filters.append(Student.created_by == _uuid(teacher_id))

    total_students = (
        await db.execute(select(func.count()).select_from(Student).where(*filters))
    ).scalar()
    senior_students = (
        await db.execute(
            select(func.count()).select_from(Student).where(Student.is_senior == True, *filters)
        )
    ).scalar()
    return {"total_students": total_students, "senior_students": senior_students}


async def get_overview_statistics(db: AsyncSession, teacher_id: Optional[str] = None) -> dict:
    filters = [Student.is_active == True]
    if teacher_id:
        filters.append(Student.created_by == _uuid(teacher_id))

    total_students = (
        await db.execute(select(func.count()).select_from(Student).where(*filters))
    ).scalar()
    senior_students = (
        await db.execute(
            select(func.count()).select_from(Student).where(Student.is_senior == True, *filters)
        )
    ).scalar()
    total_teachers = (
        await db.execute(select(func.count()).select_from(Teacher).where(Teacher.is_active == True))
    ).scalar()

    class_filters = [Classroom.is_active == True]
    if teacher_id:
        class_filters.append(Classroom.teacher_id == _uuid(teacher_id))
    total_classrooms = (
        await db.execute(select(func.count()).select_from(Classroom).where(*class_filters))
    ).scalar()

    stage_rows = await db.execute(
        select(Student.stage, func.count()).where(*filters).group_by(Student.stage)
    )
    stage_distribution = {stage: count for stage, count in stage_rows.all()}

    return {
        "total_students": total_students,
        "senior_students": senior_students,
        "total_teachers": total_teachers,
        "total_classrooms": total_classrooms,
        "active_this_week": 0,
        "stage_distribution": stage_distribution,
        "score_trend": [],
    }


async def get_leaderboard(
    db: AsyncSession,
    limit: int = 20,
    teacher_id: Optional[str] = None,
    classroom_id: Optional[str] = None,
) -> list:
    query = select(Student).where(Student.is_active == True)
    if teacher_id:
        query = query.where(Student.created_by == _uuid(teacher_id))
    if classroom_id:
        query = query.where(Student.classroom_id == _uuid(classroom_id))

    rows = await db.execute(query.order_by(Student.total_score.desc()).limit(limit))
    students = rows.scalars().all()

    return [
        {
            "rank": idx + 1,
            "id": str(student.id),
            "name": student.name,
            "avatar": student.avatar,
            "total_score": student.total_score,
            "stage": student.stage,
            "is_senior": student.is_senior,
            "classroom_id": str(student.classroom_id) if student.classroom_id else None,
        }
        for idx, student in enumerate(students)
    ]


async def get_school_leaderboard(db: AsyncSession, limit: int = 20) -> list:
    return await get_leaderboard(db=db, limit=limit, teacher_id=None, classroom_id=None)


async def update_student_profile(student_id: str, data: dict, db: AsyncSession) -> Student:
    student = await get_student_by_id(student_id, db)
    if "birthday" in data:
        student.birthday = _parse_date(data.pop("birthday"))
    for key, value in data.items():
        if value is not None and hasattr(student, key):
            setattr(student, key, value)
    student.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(student)
    return student
