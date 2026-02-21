from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.score_record import ScoreRecord
from app.models.student import Student
from app.core.exceptions import NotFoundException, BadRequestException
from datetime import datetime, timezone
from typing import Optional


SCORE_CONFIG = {
    "root": {"field": "root_score", "weight": 1},
    "trunk": {"field": "trunk_score", "weight": 1},
    "leaf": {"field": "leaf_count", "weight": 10},
    "fruit": {"field": "fruit_count", "weight": 100},
}

GROWTH_STAGES = {
    'sprout': (0, 1499),
    'seedling': (1500, 2999),
    'small': (3000, 4499),
    'medium': (4500, 5999),
    'large': (6000, 7499),
    'xlarge': (7500, 8999),
    'fruitful': (9000, 999999999),
}


def calculate_stage(total_score: int) -> str:
    for stage, (min_score, max_score) in GROWTH_STAGES.items():
        if min_score <= total_score <= max_score:
            return stage
    return 'sprout'


async def add_score(
    student_id: str,
    teacher_id: str,
    score_type: str,
    score: int,
    reason: Optional[str],
    db: AsyncSession
) -> ScoreRecord:
    if score_type not in SCORE_CONFIG:
        raise BadRequestException("无效的积分类型")
    
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise NotFoundException("学员不存在")
    
    config = SCORE_CONFIG[score_type]
    field = config["field"]
    weight = config["weight"]
    
    new_score = score * weight
    old_total = student.total_score
    
    await db.execute(
        update(Student)
        .where(Student.id == student_id)
        .values(
            **{field: getattr(student, field) + new_score},
            total_score=student.total_score + new_score,
            stage=calculate_stage(old_total + new_score),
            updated_at=datetime.now(timezone.utc)
        )
    )
    
    if field in ["root_score", "trunk_score"]:
        new_root_trunk = student.root_score + student.trunk_score + new_score
        if new_root_trunk >= 4500 and not student.ever_reached_senior:
            await db.execute(
                update(Student)
                .where(Student.id == student_id)
                .values(is_senior=True, ever_reached_senior=True)
            )
    
    record = ScoreRecord(
        student_id=student_id,
        teacher_id=teacher_id,
        score_type=score_type,
        score=score,
        reason=reason
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    
    return record


async def get_scores(student_id: str, db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    query = select(ScoreRecord).where(ScoreRecord.student_id == student_id).order_by(ScoreRecord.created_at.desc())
    
    from sqlalchemy import func
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()
    
    return {
        "items": records,
        "total": total
    }


async def delete_score(score_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(ScoreRecord).where(ScoreRecord.id == score_id))
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundException("积分记录不存在")
    
    student = await db.get(Student, record.student_id)
    config = SCORE_CONFIG[record.score_type]
    field = config["field"]
    weight = config["weight"]
    score_to_deduct = record.score * weight
    
    await db.execute(
        update(Student)
        .where(Student.id == record.student_id)
        .values(
            **{field: max(0, getattr(student, field) - score_to_deduct)},
            total_score=max(0, student.total_score - score_to_deduct),
            updated_at=datetime.now(timezone.utc)
        )
    )
    
    await db.delete(record)
    await db.commit()
