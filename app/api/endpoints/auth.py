from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_teacher
from app.models.user import Teacher
from app.schemas.user import LoginRequest, LoginResponse, ChangePasswordRequest
from app.services import auth_service
from app.core.security import decode_jwt, add_to_blacklist
from app.core.redis import get_redis

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.teacher_login(request.phone, request.password, db)
    return result


@router.post("/logout")
async def logout(
    current_teacher: Teacher = Depends(get_current_teacher),
    redis=Depends(get_redis)
):
    token_info = decode_jwt("")
    return {"message": "退出成功"}


@router.get("/me")
async def get_me(current_teacher: Teacher = Depends(get_current_teacher)):
    return current_teacher


@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    result = await auth_service.change_password(
        str(current_teacher.id),
        request.old_password,
        request.new_password,
        db
    )
    return result
