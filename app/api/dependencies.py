from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.core.security import decode_jwt, is_blacklisted
from app.models.base import get_db
from app.models.student import Student
from app.models.user import Teacher

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_teacher(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Teacher:
    try:
        payload = decode_jwt(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("type") != "teacher":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token type")

    jti = payload.get("jti")
    user_id = payload.get("sub")
    token_iat = payload.get("iat")
    if jti and await is_blacklisted(jti, redis):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token is blacklisted")

    try:
        user_uuid = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid subject") from exc

    result = await db.execute(select(Teacher).where(Teacher.id == user_uuid))
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    if teacher.password_changed_at and token_iat:
        token_iat_dt = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if token_iat_dt < teacher.password_changed_at:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="password changed")

    return teacher


async def get_current_admin(teacher: Teacher = Depends(get_current_teacher)) -> Teacher:
    if teacher.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin required")
    return teacher


async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Student:
    try:
        payload = decode_jwt(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("type") != "student":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token type")

    jti = payload.get("jti")
    user_id = payload.get("sub")
    token_iat = payload.get("iat")
    if jti and await is_blacklisted(jti, redis):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token is blacklisted")

    try:
        user_uuid = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid subject") from exc

    result = await db.execute(
        select(Student).where(Student.id == user_uuid, Student.is_active == True)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    if student.password_changed_at and token_iat:
        token_iat_dt = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if token_iat_dt < student.password_changed_at:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="password changed")
    return student
