from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.score_record import ScoreRecord
from app.models.student import Student
from app.models.student_book_score import StudentBookScore
from app.models.work import Work

PRACTICE_ALLOWED_SCORES = {5, 20, 50, 70}
TERMS = {"spring", "summer", "autumn"}
TARGET_PARTS = {"root", "trunk"}

GROWTH_STAGES = {
    "sprout": (0, 1499),
    "seedling": (1500, 2999),
    "small": (3000, 4499),
    "medium": (4500, 5999),
    "large": (6000, 7499),
    "xlarge": (7500, 8999),
    "fruitful": (9000, 999999999),
}

GRADE_BOOK_LIMITS = {
    "1": 6,
    "2": 8,
    "3": 10,
}


def _uuid(value: str) -> UUID:
    return UUID(value)


def _normalize_grade(grade: Optional[str]) -> str:
    if not grade:
        return "4"
    raw = grade.strip()
    if raw.endswith("年级"):
        raw = raw[:-2]
    return raw


def _book_limit_for_grade(grade: Optional[str]) -> int:
    normalized = _normalize_grade(grade)
    return GRADE_BOOK_LIMITS.get(normalized, 12)


def _homework_multiplier(total_score: int) -> int:
    if total_score > 5000:
        return 5
    if total_score > 2600:
        return 3
    if total_score > 1200:
        return 2
    return 1


def calculate_stage(total_score: int) -> str:
    for stage, (minimum, maximum) in GROWTH_STAGES.items():
        if minimum <= total_score <= maximum:
            return stage
    return "sprout"


async def _get_student(student_id: str, db: AsyncSession) -> Student:
    row = await db.execute(select(Student).where(Student.id == _uuid(student_id), Student.is_active == True))
    student = row.scalar_one_or_none()
    if not student:
        raise NotFoundException("student not found")
    return student


async def _enforce_term(term: str) -> str:
    if term not in TERMS:
        raise BadRequestException("term must be one of spring/summer/autumn")
    return term


async def recalc_student_totals(student_id: str, db: AsyncSession) -> Student:
    student = await _get_student(student_id, db)

    root_score = (
        await db.execute(
            select(func.coalesce(func.sum(StudentBookScore.current_score), 0)).where(
                StudentBookScore.student_id == student.id,
                StudentBookScore.target_part == "root",
            )
        )
    ).scalar_one()
    trunk_score = (
        await db.execute(
            select(func.coalesce(func.sum(StudentBookScore.current_score), 0)).where(
                StudentBookScore.student_id == student.id,
                StudentBookScore.target_part == "trunk",
            )
        )
    ).scalar_one()
    homework_total = (
        await db.execute(
            select(func.coalesce(func.sum(ScoreRecord.score), 0)).where(
                ScoreRecord.student_id == student.id, ScoreRecord.score_type == "homework"
            )
        )
    ).scalar_one()
    competition_total = (
        await db.execute(
            select(func.coalesce(func.sum(ScoreRecord.score), 0)).where(
                ScoreRecord.student_id == student.id, ScoreRecord.score_type == "competition"
            )
        )
    ).scalar_one()
    work_total = (
        await db.execute(
            select(func.coalesce(func.sum(Work.score), 0)).where(
                Work.student_id == student.id, Work.is_active == True
            )
        )
    ).scalar_one()

    total_score = int(root_score + trunk_score + homework_total + competition_total + work_total)
    student.root_score = int(root_score)
    student.trunk_score = int(trunk_score)
    student.leaf_count = int(homework_total)
    student.fruit_count = int(competition_total)
    student.total_score = total_score
    student.stage = calculate_stage(total_score)
    student.is_senior = (student.root_score + student.trunk_score) >= 4500
    if student.is_senior:
        student.ever_reached_senior = True
    student.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(student)
    return student


async def _add_practice_score(
    student: Student,
    teacher_id: str,
    score: int,
    reason: Optional[str],
    term: str,
    target_part: str,
    book_id: str,
    db: AsyncSession,
) -> ScoreRecord:
    if score not in PRACTICE_ALLOWED_SCORES:
        raise BadRequestException("practice score must be one of 5/20/50/70")
    if target_part not in TARGET_PARTS:
        raise BadRequestException("target_part must be root or trunk")

    book_uuid = _uuid(book_id)
    term_scores = await db.execute(
        select(StudentBookScore).where(
            StudentBookScore.student_id == student.id,
            StudentBookScore.term == term,
        )
    )
    book_score_rows = term_scores.scalars().all()
    existing_book_ids = {row.book_id for row in book_score_rows}
    limit = _book_limit_for_grade(student.grade)
    if book_uuid not in existing_book_ids and len(existing_book_ids) >= limit:
        raise BadRequestException(f"grade limit reached: max {limit} books in this term")

    score_row_result = await db.execute(
        select(StudentBookScore).where(
            StudentBookScore.student_id == student.id,
            StudentBookScore.book_id == book_uuid,
            StudentBookScore.term == term,
            StudentBookScore.target_part == target_part,
        )
    )
    score_row = score_row_result.scalar_one_or_none()
    if score_row is None:
        score_row = StudentBookScore(
            student_id=student.id,
            book_id=book_uuid,
            term=term,
            target_part=target_part,
            current_score=score,
            max_single_score=score,
            updated_by=_uuid(teacher_id),
        )
        db.add(score_row)
    else:
        score_row.current_score = score
        score_row.max_single_score = max(score_row.max_single_score, score)
        score_row.updated_by = _uuid(teacher_id)
        score_row.updated_at = datetime.now(timezone.utc)

    record = ScoreRecord(
        student_id=student.id,
        teacher_id=_uuid(teacher_id),
        score_type="practice",
        score=score,
        raw_score=score,
        multiplier=1,
        term=term,
        target_part=target_part,
        book_id=book_uuid,
        reason=reason,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    await recalc_student_totals(str(student.id), db)
    return record


async def _add_homework_score(
    student: Student,
    teacher_id: str,
    score: int,
    reason: Optional[str],
    term: str,
    db: AsyncSession,
) -> ScoreRecord:
    if score < 0:
        raise BadRequestException("homework score must be >= 0")
    count = (
        await db.execute(
            select(func.count()).select_from(ScoreRecord).where(
                ScoreRecord.student_id == student.id,
                ScoreRecord.score_type == "homework",
                ScoreRecord.term == term,
            )
        )
    ).scalar_one()
    if count >= 12:
        raise BadRequestException("homework limit reached: max 12 records in this term")

    multiplier = _homework_multiplier(student.total_score)
    applied = score * multiplier
    record = ScoreRecord(
        student_id=student.id,
        teacher_id=_uuid(teacher_id),
        score_type="homework",
        score=applied,
        raw_score=score,
        multiplier=multiplier,
        term=term,
        reason=reason,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    await recalc_student_totals(str(student.id), db)
    return record


async def _add_competition_score(
    student: Student,
    teacher_id: str,
    score: int,
    reason: Optional[str],
    term: str,
    db: AsyncSession,
) -> ScoreRecord:
    if score < 0 or score > 100:
        raise BadRequestException("competition score must be between 0 and 100")

    record = ScoreRecord(
        student_id=student.id,
        teacher_id=_uuid(teacher_id),
        score_type="competition",
        score=score,
        raw_score=score,
        multiplier=1,
        term=term,
        reason=reason,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    await recalc_student_totals(str(student.id), db)
    return record


async def add_score(
    student_id: str,
    teacher_id: str,
    score_type: str,
    score: int,
    reason: Optional[str],
    db: AsyncSession,
    term: Optional[str] = None,
    target_part: Optional[str] = None,
    book_id: Optional[str] = None,
) -> ScoreRecord:
    student = await _get_student(student_id, db)
    if not term:
        raise BadRequestException("term is required")
    await _enforce_term(term)

    if score_type == "practice":
        if not target_part or not book_id:
            raise BadRequestException("practice needs target_part and book_id")
        return await _add_practice_score(
            student=student,
            teacher_id=teacher_id,
            score=score,
            reason=reason,
            term=term,
            target_part=target_part,
            book_id=book_id,
            db=db,
        )
    if score_type == "homework":
        return await _add_homework_score(
            student=student, teacher_id=teacher_id, score=score, reason=reason, term=term, db=db
        )
    if score_type == "competition":
        return await _add_competition_score(
            student=student, teacher_id=teacher_id, score=score, reason=reason, term=term, db=db
        )
    raise BadRequestException("score_type must be practice/homework/competition")


async def get_scores(
    student_id: str,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    score_type: Optional[str] = None,
    term: Optional[str] = None,
) -> dict:
    query = select(ScoreRecord).where(ScoreRecord.student_id == _uuid(student_id))
    if score_type:
        query = query.where(ScoreRecord.score_type == score_type)
    if term:
        query = query.where(ScoreRecord.term == term)
    query = query.order_by(ScoreRecord.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    rows = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    records = rows.scalars().all()
    return {"items": records, "total": total}


async def _rebuild_practice_snapshot_for_deleted_record(record: ScoreRecord, db: AsyncSession) -> None:
    if record.score_type != "practice" or not record.book_id or not record.term or not record.target_part:
        return

    history_rows = await db.execute(
        select(ScoreRecord).where(
            ScoreRecord.student_id == record.student_id,
            ScoreRecord.score_type == "practice",
            ScoreRecord.book_id == record.book_id,
            ScoreRecord.term == record.term,
            ScoreRecord.target_part == record.target_part,
        ).order_by(ScoreRecord.created_at.asc())
    )
    records = history_rows.scalars().all()
    if not records:
        await db.execute(
            delete(StudentBookScore).where(
                StudentBookScore.student_id == record.student_id,
                StudentBookScore.book_id == record.book_id,
                StudentBookScore.term == record.term,
                StudentBookScore.target_part == record.target_part,
            )
        )
        await db.commit()
        return

    latest = records[-1]
    max_single = max(item.raw_score or item.score for item in records)
    existing = await db.execute(
        select(StudentBookScore).where(
            StudentBookScore.student_id == record.student_id,
            StudentBookScore.book_id == record.book_id,
            StudentBookScore.term == record.term,
            StudentBookScore.target_part == record.target_part,
        )
    )
    row = existing.scalar_one_or_none()
    if row is None:
        row = StudentBookScore(
            student_id=record.student_id,
            book_id=record.book_id,
            term=record.term,
            target_part=record.target_part,
            current_score=latest.raw_score or latest.score,
            max_single_score=max_single,
            updated_by=latest.teacher_id,
        )
        db.add(row)
    else:
        row.current_score = latest.raw_score or latest.score
        row.max_single_score = max_single
        row.updated_by = latest.teacher_id
        row.updated_at = datetime.now(timezone.utc)
    await db.commit()


async def delete_score(score_id: str, db: AsyncSession) -> None:
    row = await db.execute(select(ScoreRecord).where(ScoreRecord.id == _uuid(score_id)))
    record = row.scalar_one_or_none()
    if not record:
        raise NotFoundException("score record not found")

    student_id = str(record.student_id)
    await db.delete(record)
    await db.commit()
    await _rebuild_practice_snapshot_for_deleted_record(record, db)
    await recalc_student_totals(student_id, db)
