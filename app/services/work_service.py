from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.score_record import ScoreRecord
from app.models.student import Student
from app.models.work import Work
from app.models.work_history import WorkHistory
from app.services.score_service import recalc_student_totals


def _uuid(value: str) -> UUID:
    return UUID(value)


async def _find_work_slot(student_id: str, term: str, slot_index: int, db: AsyncSession) -> Optional[Work]:
    row = await db.execute(
        select(Work).where(
            Work.student_id == _uuid(student_id),
            Work.term == term,
            Work.slot_index == slot_index,
            Work.is_active == True,
        )
    )
    return row.scalar_one_or_none()


async def create_or_replace_work(
    student_id: str,
    teacher_id: str,
    data: dict,
    db: AsyncSession,
) -> Work:
    score = int(data["score"])
    if score < 0 or score > 100:
        raise BadRequestException("work score must be between 0 and 100")

    slot_index = int(data["slot_index"])
    if slot_index not in (1, 2):
        raise BadRequestException("slot_index must be 1 or 2")

    term = data["term"]
    existing = await _find_work_slot(student_id, term, slot_index, db)
    student_uuid = _uuid(student_id)
    teacher_uuid = _uuid(teacher_id)

    if existing:
        db.add(
            WorkHistory(
                work_id=existing.id,
                student_id=student_uuid,
                teacher_id=teacher_uuid,
                previous_image_url=existing.image_url,
                previous_description=existing.description,
                previous_score=existing.score,
            )
        )
        existing.image_url = data["image_url"]
        existing.thumbnail_url = data.get("thumbnail_url")
        existing.description = data.get("description")
        existing.gallery_scope = data["gallery_scope"]
        existing.score = score
        existing.book_id = data.get("book_id")
        work = existing
    else:
        work = Work(
            student_id=student_uuid,
            teacher_id=teacher_uuid,
            term=term,
            slot_index=slot_index,
            gallery_scope=data["gallery_scope"],
            image_url=data["image_url"],
            thumbnail_url=data.get("thumbnail_url"),
            description=data.get("description"),
            score=score,
            book_id=data.get("book_id"),
        )
        db.add(work)
        await db.flush()

    # Keep score records for growth detail. Replace-in-slot should not accumulate,
    # so we soft-deactivate previous work score records for this term+slot.
    old_records = await db.execute(
        select(ScoreRecord).where(
            ScoreRecord.student_id == student_uuid,
            ScoreRecord.score_type == "work",
            ScoreRecord.term == term,
            ScoreRecord.reason == f"slot:{slot_index}",
        )
    )
    for rec in old_records.scalars().all():
        rec.score = 0
        rec.raw_score = 0

    db.add(
        ScoreRecord(
            student_id=student_uuid,
            teacher_id=teacher_uuid,
            score_type="work",
            score=score,
            raw_score=score,
            multiplier=1,
            term=term,
            work_id=work.id,
            reason=f"slot:{slot_index}",
        )
    )

    await db.commit()
    await db.refresh(work)
    await recalc_student_totals(student_id, db)
    return work


async def get_works(
    student_id: str,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    term: Optional[str] = None,
    gallery_scope: Optional[str] = None,
) -> dict:
    query = select(Work).where(Work.student_id == _uuid(student_id), Work.is_active == True)
    if term:
        query = query.where(Work.term == term)
    if gallery_scope == "classroom":
        query = query.where(Work.gallery_scope.in_(("classroom", "both")))
    elif gallery_scope == "school":
        query = query.where(Work.gallery_scope.in_(("school", "both")))
    query = query.order_by(Work.term.desc(), Work.slot_index.asc(), Work.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    rows = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    return {"items": rows.scalars().all(), "total": total}


async def get_work_detail(work_id: str, db: AsyncSession) -> Work:
    row = await db.execute(select(Work).where(Work.id == _uuid(work_id), Work.is_active == True))
    work = row.scalar_one_or_none()
    if not work:
        raise NotFoundException("work not found")
    return work


async def delete_work(work_id: str, db: AsyncSession) -> None:
    work = await get_work_detail(work_id, db)
    work.is_active = False
    await db.commit()
    await recalc_student_totals(str(work.student_id), db)


async def get_classroom_gallery(
    classroom_id: str,
    db: AsyncSession,
    term: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = (
        select(Work)
        .join(Student, Student.id == Work.student_id)
        .where(
            Work.is_active == True,
            Student.classroom_id == _uuid(classroom_id),
            Work.gallery_scope.in_(("classroom", "both")),
        )
    )
    if term:
        query = query.where(Work.term == term)
    query = query.order_by(Work.created_at.desc())
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    rows = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    return {"items": rows.scalars().all(), "total": total}


async def get_school_gallery(
    db: AsyncSession,
    term: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = select(Work).where(
        Work.is_active == True,
        Work.gallery_scope.in_(("school", "both")),
    )
    if term:
        query = query.where(Work.term == term)
    query = query.order_by(Work.created_at.desc())
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    rows = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    return {"items": rows.scalars().all(), "total": total}
