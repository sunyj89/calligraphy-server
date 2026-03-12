from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.score_record import ScoreRecord
from app.models.student import Student

SCORE_CONFIG = {
    "root": {"field": "root_score", "weight": 1},
    "trunk": {"field": "trunk_score", "weight": 1},
    "leaf": {"field": "leaf_count", "weight": 10},
    "fruit": {"field": "fruit_count", "weight": 100},
}

SCORE_TYPE_ALIASES = {
    "basic": "root",
    "homework": "leaf",
    "competition": "fruit",
    "adjustment": None,
}

GROWTH_STAGES = {
    "sprout": (0, 1499),
    "seedling": (1500, 2999),
    "small": (3000, 4499),
    "medium": (4500, 5999),
    "large": (6000, 7499),
    "xlarge": (7500, 8999),
    "fruitful": (9000, 999999999),
}


def _as_uuid(value: str) -> UUID:
    return UUID(value)


def _resolve_score_type(score_type: str | None) -> str | None:
    if score_type in (None, "", "all"):
        return None
    return SCORE_TYPE_ALIASES.get(score_type, score_type)


def calculate_stage(total_score: int) -> str:
    for stage, (min_score, max_score) in GROWTH_STAGES.items():
        if min_score <= total_score <= max_score:
            return stage
    return "sprout"


async def add_score(
    student_id: str,
    teacher_id: str,
    score_type: str,
    score: int,
    reason: Optional[str],
    db: AsyncSession,
) -> ScoreRecord:
    student_uuid = _as_uuid(student_id)
    teacher_uuid = _as_uuid(teacher_id)
    resolved_type = _resolve_score_type(score_type)

    if resolved_type is None and score_type == "adjustment":
        result = await db.execute(select(Student).where(Student.id == student_uuid))
        student = result.scalar_one_or_none()
        if not student:
            raise NotFoundException("瀛﹀憳涓嶅瓨鍦?")

        new_total = max(0, student.total_score + score)
        await db.execute(
            update(Student)
            .where(Student.id == student_uuid)
            .values(
                total_score=new_total,
                stage=calculate_stage(new_total),
                updated_at=datetime.now(timezone.utc),
            )
        )

        record = ScoreRecord(
            student_id=student_uuid,
            teacher_id=teacher_uuid,
            score_type=score_type,
            score=score,
            reason=reason,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record

    if resolved_type not in SCORE_CONFIG:
        raise BadRequestException("鏃犳晥鐨勭Н鍒嗙被鍨?")

    result = await db.execute(select(Student).where(Student.id == student_uuid))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("瀛﹀憳涓嶅瓨鍦?")

    config = SCORE_CONFIG[resolved_type]
    field = config["field"]
    weight = config["weight"]
    new_score = score * weight
    old_total = student.total_score

    await db.execute(
        update(Student)
        .where(Student.id == student_uuid)
        .values(
            **{field: getattr(student, field) + new_score},
            total_score=student.total_score + new_score,
            stage=calculate_stage(old_total + new_score),
            updated_at=datetime.now(timezone.utc),
        )
    )

    if field in ["root_score", "trunk_score"]:
        new_root_trunk = student.root_score + student.trunk_score + new_score
        if new_root_trunk >= 4500 and not student.ever_reached_senior:
            await db.execute(
                update(Student)
                .where(Student.id == student_uuid)
                .values(is_senior=True, ever_reached_senior=True)
            )

    record = ScoreRecord(
        student_id=student_uuid,
        teacher_id=teacher_uuid,
        score_type=score_type,
        score=score,
        reason=reason,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_scores(
    student_id: str,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    score_type: str | None = None,
) -> dict:
    query = select(ScoreRecord).where(ScoreRecord.student_id == _as_uuid(student_id))
    resolved_type = _resolve_score_type(score_type)
    if resolved_type:
        query = query.where(ScoreRecord.score_type == resolved_type)
    query = query.order_by(ScoreRecord.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()

    return {"items": records, "total": total}


async def delete_score(score_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(ScoreRecord).where(ScoreRecord.id == _as_uuid(score_id)))
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("绉垎璁板綍涓嶅瓨鍦?")

    resolved_type = _resolve_score_type(record.score_type)
    if resolved_type is None:
        score_to_deduct = record.score
        await db.execute(
            update(Student)
            .where(Student.id == record.student_id)
            .values(
                total_score=func.max(0, Student.total_score - score_to_deduct),
                updated_at=datetime.now(timezone.utc),
            )
        )
        await db.delete(record)
        await db.commit()
        return

    student = await db.get(Student, record.student_id)
    config = SCORE_CONFIG[resolved_type]
    field = config["field"]
    weight = config["weight"]
    score_to_deduct = record.score * weight

    await db.execute(
        update(Student)
        .where(Student.id == record.student_id)
        .values(
            **{field: max(0, getattr(student, field) - score_to_deduct)},
            total_score=max(0, student.total_score - score_to_deduct),
            updated_at=datetime.now(timezone.utc),
        )
    )

    await db.delete(record)
    await db.commit()
