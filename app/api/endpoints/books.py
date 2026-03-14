from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_current_teacher
from app.models.base import get_db
from app.models.user import Teacher
from app.schemas.book import BookCreate, BookListResponse, BookResponse, BookUpdate
from app.services import book_service

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("", response_model=BookListResponse)
async def list_books(
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    books = await book_service.get_all_books(db)
    return {"items": books, "total": len(books)}


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher),
):
    return await book_service.get_book_by_id(book_id, db)


@router.post("", response_model=BookResponse)
async def create_book(
    data: BookCreate,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    return await book_service.create_book(data.model_dump(), db)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: str,
    data: BookUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    return await book_service.update_book(book_id, data.model_dump(exclude_unset=True), db)


@router.delete("/{book_id}")
async def delete_book(
    book_id: str,
    db: AsyncSession = Depends(get_db),
    admin: Teacher = Depends(get_current_admin),
):
    await book_service.delete_book(book_id, db)
    return {"message": "delete success"}
