from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_student
from app.models.base import get_db
from app.models.student import Student
from app.schemas.book import BookListResponse
from app.schemas.score import ScoreListResponse
from app.schemas.student_auth import ChangePasswordRequest, StudentAuthResponse
from app.schemas.work import WorkListResponse, WorkResponse
from app.services import book_service, score_service, student_auth_service, student_service, work_service

router = APIRouter(prefix="/api/student", tags=["student"])


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


@router.get("/scores", response_model=ScoreListResponse)
async def get_my_scores(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    score_type: str | None = Query(None),
    term: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await score_service.get_scores(
        str(current_student.id), db, page, page_size, score_type, term
    )


@router.get("/works", response_model=WorkListResponse)
async def get_my_works(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    term: str | None = Query(None),
    gallery_scope: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await work_service.get_works(
        str(current_student.id), db, page, page_size, term, gallery_scope
    )


@router.get("/gallery/classroom", response_model=WorkListResponse)
async def get_classroom_gallery(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    term: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    if not current_student.classroom_id:
        return {"items": [], "total": 0}
    return await work_service.get_classroom_gallery(
        classroom_id=str(current_student.classroom_id),
        db=db,
        term=term,
        page=page,
        page_size=page_size,
    )


@router.get("/gallery/school", response_model=WorkListResponse)
async def get_school_gallery(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    term: str | None = Query(None),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await work_service.get_school_gallery(db=db, term=term, page=page, page_size=page_size)


@router.get("/works/{work_id}", response_model=WorkResponse)
async def get_my_work_detail(
    work_id: str,
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    work = await work_service.get_work_detail(work_id, db)
    if work.student_id != current_student.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return work


@router.get("/leaderboard/classroom")
async def get_classroom_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    if not current_student.classroom_id:
        return []
    return await student_service.get_leaderboard(
        db=db,
        limit=limit,
        teacher_id=None,
        classroom_id=str(current_student.classroom_id),
    )


@router.get("/leaderboard/school")
async def get_school_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    current_student: Student = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
):
    return await student_service.get_school_leaderboard(db=db, limit=limit)


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
    return await student_service.update_student_profile(
        str(current_student.id), request.model_dump(exclude_unset=True), db
    )


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
