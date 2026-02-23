from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.schemas.student_auth import (
    ChangePasswordRequest,
    ChangePhoneRequest,
    StudentAuthResponse,
)
from app.schemas.book import BookListResponse
from app.services import student_auth_service, student_service, book_service
from app.api.dependencies import get_current_student
from app.models.student import Student
from pydantic import BaseModel

router = APIRouter(prefix="/api/student", tags=["学生信息"])


@router.get("/me", response_model=StudentAuthResponse)
async def get_me(current_student: Student = Depends(get_current_student)):
    return current_student


@router.get("/books", response_model=BookListResponse)
async def get_student_books(
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    books = await book_service.get_all_books(db)
    return {"items": books, "total": len(books)}


class ProfileUpdateRequest(BaseModel):
    name: str = None
    avatar: str = None
    gender: str = None
    birthday: str = None
    school: str = None
    grade: str = None


@router.put("/profile", response_model=StudentAuthResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    data = request.model_dump(exclude_unset=True)
    return await student_service.update_student_profile(str(current_student.id), data, db)


@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    return await student_auth_service.change_password(
        str(current_student.id),
        request.old_password or "",
        request.new_password,
        db
    )


@router.put("/phone")
async def change_phone(
    request: ChangePhoneRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    return await student_auth_service.change_phone(
        str(current_student.id),
        request.new_phone,
        request.code,
        db
    )
