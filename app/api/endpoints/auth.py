from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_teacher
from app.core.redis import get_redis
from app.core.security import add_to_blacklist, decode_jwt
from app.models.base import get_db
from app.models.user import Teacher
from app.schemas.user import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    TeacherResponse,
    UpdateProfileRequest,
)
from app.services import audit_service, auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await auth_service.teacher_login(request.phone, request.password, db)
    teacher = payload["teacher"]
    ip_address = http_request.headers.get("x-forwarded-for") or (
        http_request.client.host if http_request.client else None
    )
    await audit_service.create_login_log(
        db=db,
        account=teacher.phone,
        platform="teacher",
        ip_address=ip_address,
        actor_id=str(teacher.id),
        actor_name=teacher.name,
    )
    await db.commit()
    return payload


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_teacher: Teacher = Depends(get_current_teacher),
    redis=Depends(get_redis),
):
    token_info = decode_jwt(token)
    jti = token_info.get("jti")
    if jti:
        await add_to_blacklist(jti, redis)
    return {"message": "logout success"}


@router.get("/me", response_model=TeacherResponse)
async def get_me(current_teacher: Teacher = Depends(get_current_teacher)):
    return current_teacher


@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.change_password(
        str(current_teacher.id),
        request.old_password,
        request.new_password,
        db,
    )


@router.put("/profile", response_model=TeacherResponse)
async def update_profile(
    request: UpdateProfileRequest,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    if request.name is not None:
        current_teacher.name = request.name
    await db.commit()
    await db.refresh(current_teacher)
    return current_teacher
