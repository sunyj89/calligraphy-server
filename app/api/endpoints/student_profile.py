from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_student
from app.models.base import get_db
from app.models.student import Student
from app.schemas.score import ScoreListResponse
from app.schemas.book import BookListResponse
from app.schemas.student_auth import ChangePasswordRequest, StudentAuthResponse
from app.schemas.work import WorkListResponse, WorkResponse
from app.services import book_service, score_service, student_auth_service, student_service, work_service
from fastapi import Query

router = APIRouter(prefix="/api/student", tags=["瀛︾敓淇℃伅"])


@router.get("/me", response_model=StudentAuthResponse)
async def get_me(current_student: Student = Depends(get_current_student)):
    return current_student


@router.get("/books", response_model=BookListResponse)
async def get_student_books(
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    books = await book_service.get_all_books(db)
    return {"items": books, "total": len(books)}


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    avatar: str | None = None
    gender: str | None = None
    birthday: str | None = None
    school: str | None = None
    grade: str | None = None


@router.put("/profile", response_model=StudentAuthResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    data = request.model_dump(exclude_unset=True)
    return await student_service.update_student_profile(str(current_student.id), data, db)


@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await student_auth_service.change_password(
        str(current_student.id),
        request.old_password or "",
        request.new_password,
        db,
    )


@router.get("/scores", response_model=ScoreListResponse)
async def get_student_scores(
    type: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await score_service.get_scores(str(current_student.id), db, page, page_size, type)


@router.get("/works", response_model=WorkListResponse)
async def get_student_works(
    book_id: str | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await work_service.get_works(str(current_student.id), db, page, page_size, book_id)


@router.get("/works/{work_id}", response_model=WorkResponse)
async def get_student_work_detail(
    work_id: str,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await work_service.get_work(work_id, str(current_student.id), db)
