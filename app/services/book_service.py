from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.book import Book
from app.models.student_book_score import StudentBookScore

VALID_TERMS = {"spring", "summer", "autumn"}


def get_current_term() -> str:
    month = datetime.now().month
    if 1 <= month <= 4:
        return "spring"
    if 5 <= month <= 8:
        return "summer"
    return "autumn"


def resolve_bookshelf_term(term: str | None) -> str:
    if term is None:
        return get_current_term()
    if term not in VALID_TERMS:
        raise BadRequestException("term must be one of spring/summer/autumn")
    return term


async def get_all_books(db: AsyncSession) -> list[Book]:
    result = await db.execute(select(Book).where(Book.is_active == True).order_by(Book.order_num))
    return result.scalars().all()


async def get_books_for_student(student_id: str, db: AsyncSession, term: str | None = None) -> list[dict]:
    books = await get_all_books(db)
    resolved_term = resolve_bookshelf_term(term)
    score_rows = await db.execute(
        select(
            StudentBookScore.book_id,
            func.coalesce(func.max(StudentBookScore.max_single_score), 0).label("lit_score"),
        )
        .where(
            StudentBookScore.student_id == UUID(student_id),
            StudentBookScore.term == resolved_term,
        )
        .group_by(StudentBookScore.book_id)
    )
    lit_map = {str(book_id): int(lit_score) for book_id, lit_score in score_rows.all()}

    return [
        {
            "id": str(book.id),
            "name": book.name,
            "cover": book.cover,
            "description": book.description,
            "order_num": book.order_num,
            "is_active": book.is_active,
            "created_at": book.created_at,
            "is_lit": lit_map.get(str(book.id), 0) >= 50,
            "lit_score": lit_map.get(str(book.id), 0),
        }
        for book in books
    ]


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
