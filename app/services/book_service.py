from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.book import Book
from app.core.exceptions import NotFoundException


async def get_all_books(db: AsyncSession) -> list[Book]:
    result = await db.execute(select(Book).where(Book.is_active == True).order_by(Book.order_num))
    return result.scalars().all()


async def get_book_by_id(book_id: str, db: AsyncSession) -> Book:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise NotFoundException("练习册不存在")
    return book


async def create_book(data: dict, db: AsyncSession) -> Book:
    book = Book(**data)
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return book


async def update_book(book_id: str, data: dict, db: AsyncSession) -> Book:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise NotFoundException("练习册不存在")

    for key, value in data.items():
        if value is not None:
            setattr(book, key, value)

    await db.commit()
    await db.refresh(book)
    return book


async def delete_book(book_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise NotFoundException("练习册不存在")
    book.is_active = False
    await db.commit()
