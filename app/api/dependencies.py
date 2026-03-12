from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import get_redis
from app.core.security import decode_jwt
from app.models.base import get_db
from app.models.student import Student
from app.models.user import Teacher

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _parse_user_id(user_id: str | None) -> UUID:
    try:
        return UUID(str(user_id))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="鏃犳晥鐨勭敤鎴锋爣璇?",
        ) from exc


async def get_current_teacher(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Teacher:
    from sqlalchemy import select

    from app.core.security import is_blacklisted

    payload = decode_jwt(token)
    jti = payload.get("jti")
    user_id = _parse_user_id(payload.get("sub"))
    token_iat = payload.get("iat")

    if await is_blacklisted(jti, redis):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token宸插け鏁?",
        )

    result = await db.execute(select(Teacher).where(Teacher.id == user_id))
    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="鐢ㄦ埛涓嶅瓨鍦?",
        )

    if teacher.password_changed_at:
        token_iat_dt = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if token_iat_dt < teacher.password_changed_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="瀵嗙爜宸蹭慨鏀癸紝璇烽噸鏂扮櫥褰?",
            )

    return teacher


async def get_current_admin(
    teacher: Teacher = Depends(get_current_teacher),
) -> Teacher:
    if teacher.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="闇€瑕佺鐞嗗憳鏉冮檺",
        )
    return teacher


async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Student:
    from sqlalchemy import select

    from app.core.security import is_blacklisted

    payload = decode_jwt(token)
    jti = payload.get("jti")
    user_id = _parse_user_id(payload.get("sub"))
    token_type = payload.get("type")

    if token_type != "student":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="鏃犳晥鐨則oken绫诲瀷",
        )

    if await is_blacklisted(jti, redis):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token宸插け鏁?",
        )

    result = await db.execute(select(Student).where(Student.id == user_id))
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="鐢ㄦ埛涓嶅瓨鍦?",
        )

    return student
