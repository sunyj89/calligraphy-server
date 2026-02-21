from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.book import Book


async def get_all_books(db: AsyncSession) -> list[Book]:
    result = await db.execute(select(Book).where(Book.is_active == True).order_by(Book.order_num))
    return result.scalars().all()


async def get_book_by_id(book_id: str, db: AsyncSession) -> Book:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise NotFoundException("练习册不存在")
    return book
