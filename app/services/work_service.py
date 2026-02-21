from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.work import Work
from app.core.exceptions import NotFoundException


async def create_work(student_id: str, data: dict, db: AsyncSession) -> Work:
    work = Work(student_id=student_id, **data)
    db.add(work)
    await db.commit()
    await db.refresh(work)
    return work


async def get_works(student_id: str, db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    query = select(Work).where(Work.student_id == student_id, Work.is_active == True).order_by(Work.created_at.desc())
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    works = result.scalars().all()
    
    return {
        "items": works,
        "total": total
    }


async def delete_work(work_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Work).where(Work.id == work_id))
    work = result.scalar_one()
    work.is_active = False
    await db.commit()
