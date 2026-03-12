from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException
from app.models.work import Work


def _as_uuid(value: str) -> UUID:
    return UUID(value)


async def create_work(student_id: str, data: dict, db: AsyncSession) -> Work:
    work = Work(student_id=_as_uuid(student_id), **data)
    db.add(work)
    await db.commit()
    await db.refresh(work)
    return work


async def get_works(
    student_id: str,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    book_id: str | None = None,
) -> dict:
    query = select(Work).where(Work.student_id == _as_uuid(student_id), Work.is_active == True)
    if book_id:
        query = query.where(Work.book_id == _as_uuid(book_id))
    query = query.order_by(Work.created_at.desc())

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    works = result.scalars().all()

    return {"items": works, "total": total}


async def get_work(work_id: str, student_id: str, db: AsyncSession) -> Work:
    result = await db.execute(
        select(Work).where(
            Work.id == _as_uuid(work_id),
            Work.student_id == _as_uuid(student_id),
            Work.is_active == True,
        )
    )
    work = result.scalar_one_or_none()
    if not work:
        raise NotFoundException("浣滃搧涓嶅瓨鍦?")
    return work


async def delete_work(work_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Work).where(Work.id == _as_uuid(work_id)))
    work = result.scalar_one()
    work.is_active = False
    await db.commit()
