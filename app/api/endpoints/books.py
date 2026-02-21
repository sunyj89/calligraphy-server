from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
from app.schemas.book import BookListResponse, BookResponse
from app.services import book_service

router = APIRouter(prefix="/api/books", tags=["练习册"])


@router.get("", response_model=BookListResponse)
async def list_books(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    books = await book_service.get_all_books(db)
    return {"items": books, "total": len(books)}


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    return await book_service.get_book_by_id(book_id, db)
