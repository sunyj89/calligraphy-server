from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.exceptions import NotFoundException
from app.models.classroom import Classroom
from app.models.score_record import ScoreRecord
from app.models.student import Student
from app.models.user import Teacher


def _as_uuid(value: str) -> UUID:
    return UUID(value)


async def get_student_by_id(student_id: str, db: AsyncSession) -> Student:
    result = await db.execute(
        select(Student).where(Student.id == _as_uuid(student_id), Student.is_active == True)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("瀛﹀憳涓嶅瓨鍦?")
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
        query = query.where(Student.created_by == _as_uuid(teacher_id))

    if classroom_id:
        query = query.where(Student.classroom_id == _as_uuid(classroom_id))

    if search:
        query = query.where(Student.name.ilike(f"%{search}%") | Student.phone.ilike(f"%{search}%"))

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
        "total_pages": (total + page_size - 1) // page_size,
    }


async def create_student(data: dict, teacher_id: str, db: AsyncSession) -> Student:
    password = data.pop("password")
    data["password_hash"] = hash_password(password)
    data["password_changed_at"] = datetime.now(timezone.utc)
    student = Student(**data, created_by=_as_uuid(teacher_id))
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


async def update_student(student_id: str, data: dict, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.id == _as_uuid(student_id)))
    student = result.scalar_one()

    password = data.pop("password", None)
    if password:
        student.password_hash = hash_password(password)
        student.password_changed_at = datetime.now(timezone.utc)

    for key, value in data.items():
        if value is not None:
            setattr(student, key, value)

    await db.commit()
    await db.refresh(student)
    return student


async def delete_student(student_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Student).where(Student.id == _as_uuid(student_id)))
    student = result.scalar_one()
    student.is_active = False
    await db.commit()


async def get_student_statistics(db: AsyncSession, teacher_id: Optional[str] = None) -> dict:
    base_filter = [Student.is_active == True]
    if teacher_id:
        base_filter.append(Student.created_by == _as_uuid(teacher_id))

    total_result = await db.execute(select(func.count()).select_from(Student).where(*base_filter))
    total = total_result.scalar()

    senior_result = await db.execute(
        select(func.count()).select_from(Student).where(Student.is_senior == True, *base_filter)
    )
    senior_count = senior_result.scalar()

    return {"total_students": total, "senior_students": senior_count}


async def get_overview_statistics(db: AsyncSession, teacher_id: Optional[str] = None) -> dict:
    base_filter = [Student.is_active == True]
    if teacher_id:
        base_filter.append(Student.created_by == _as_uuid(teacher_id))

    total_result = await db.execute(select(func.count()).select_from(Student).where(*base_filter))
    total_students = total_result.scalar()

    senior_result = await db.execute(
        select(func.count()).select_from(Student).where(Student.is_senior == True, *base_filter)
    )
    senior_students = senior_result.scalar()

    teacher_count_result = await db.execute(
        select(func.count()).select_from(Teacher).where(Teacher.is_active == True)
    )
    total_teachers = teacher_count_result.scalar()

    classroom_filter = [Classroom.is_active == True]
    if teacher_id:
        classroom_filter.append(Classroom.teacher_id == _as_uuid(teacher_id))
    classroom_count_result = await db.execute(
        select(func.count()).select_from(Classroom).where(*classroom_filter)
    )
    total_classrooms = classroom_count_result.scalar()

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_query = select(func.count(func.distinct(ScoreRecord.student_id))).where(
        ScoreRecord.created_at >= week_ago
    )
    if teacher_id:
        active_query = active_query.where(ScoreRecord.teacher_id == _as_uuid(teacher_id))
    active_result = await db.execute(active_query)
    active_this_week = active_result.scalar()

    stage_result = await db.execute(
        select(Student.stage, func.count()).where(*base_filter).group_by(Student.stage)
    )
    stage_distribution = {row[0]: row[1] for row in stage_result.all()}

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    trend_query = (
        select(
            func.date(ScoreRecord.created_at).label("date"),
            func.count().label("count"),
            func.sum(ScoreRecord.score).label("total_score"),
        )
        .where(ScoreRecord.created_at >= thirty_days_ago)
    )
    if teacher_id:
        trend_query = trend_query.where(ScoreRecord.teacher_id == _as_uuid(teacher_id))
    trend_query = trend_query.group_by(func.date(ScoreRecord.created_at)).order_by(text("date"))
    trend_result = await db.execute(trend_query)
    score_trend = [
        {"date": str(row.date), "count": row.count, "total_score": row.total_score or 0}
        for row in trend_result.all()
    ]

    return {
        "total_students": total_students,
        "senior_students": senior_students,
        "total_teachers": total_teachers,
        "total_classrooms": total_classrooms,
        "active_this_week": active_this_week,
        "stage_distribution": stage_distribution,
        "score_trend": score_trend,
    }


async def get_leaderboard(
    db: AsyncSession,
    limit: int = 20,
    teacher_id: Optional[str] = None,
    classroom_id: Optional[str] = None,
) -> list:
    query = select(Student).where(Student.is_active == True)

    if teacher_id:
        query = query.where(Student.created_by == _as_uuid(teacher_id))
    if classroom_id:
        query = query.where(Student.classroom_id == _as_uuid(classroom_id))

    query = query.order_by(Student.total_score.desc()).limit(limit)
    result = await db.execute(query)
    students = result.scalars().all()

    return [
        {
            "rank": i + 1,
            "id": str(s.id),
            "name": s.name,
            "avatar": s.avatar,
            "total_score": s.total_score,
            "stage": s.stage,
            "is_senior": s.is_senior,
            "classroom_id": str(s.classroom_id) if s.classroom_id else None,
        }
        for i, s in enumerate(students)
    ]


async def get_student_by_phone(phone: str, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.phone == phone))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("瀛﹀憳涓嶅瓨鍦?")
    return student


async def update_student_profile(student_id: str, data: dict, db: AsyncSession) -> Student:
    result = await db.execute(select(Student).where(Student.id == _as_uuid(student_id)))
    student = result.scalar_one()

    for key, value in data.items():
        if value is not None and hasattr(student, key):
            setattr(student, key, value)

    student.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(student)
    return student
