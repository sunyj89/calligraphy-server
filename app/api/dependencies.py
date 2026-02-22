from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.models.user import Teacher
from app.models.student import Student
from app.core.security import decode_jwt
from app.core.redis import get_redis
from datetime import datetime, timezone

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_teacher(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
) -> Teacher:
    from sqlalchemy import select
    from app.core.security import is_blacklisted
    
    payload = decode_jwt(token)
    jti = payload.get("jti")
    user_id = payload.get("sub")
    token_iat = payload.get("iat")
    
    if await is_blacklisted(jti, redis):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token已失效"
        )
    
    result = await db.execute(select(Teacher).where(Teacher.id == user_id))
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    if teacher.password_changed_at:
        token_iat_dt = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if token_iat_dt < teacher.password_changed_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="密码已修改，请重新登录"
            )
    
    return teacher


async def get_current_admin(
    teacher: Teacher = Depends(get_current_teacher),
) -> Teacher:
    if teacher.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return teacher


async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
) -> Student:
    from sqlalchemy import select
    from app.core.security import is_blacklisted
    
    payload = decode_jwt(token)
    jti = payload.get("jti")
    user_id = payload.get("sub")
    token_type = payload.get("type")
    
    if token_type != "student":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的token类型"
        )
    
    if await is_blacklisted(jti, redis):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token已失效"
        )
    
    result = await db.execute(select(Student).where(Student.id == user_id))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return student
