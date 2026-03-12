from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_jwt, hash_password, verify_password
from app.models.student import Student


def _as_uuid(student_id: str) -> UUID:
    return UUID(student_id)


async def student_login(phone: str, password: str, db: AsyncSession) -> dict:
    """瀛︾敓璐﹀彿瀵嗙爜鐧诲綍"""
    result = await db.execute(
        select(Student).where(Student.phone == phone, Student.is_active == True)
    )
    student = result.scalar_one_or_none()

    if not student or not student.password_hash:
        raise UnauthorizedException("鎵嬫満鍙锋垨瀵嗙爜閿欒")

    if not verify_password(password, student.password_hash):
        raise UnauthorizedException("鎵嬫満鍙锋垨瀵嗙爜閿欒")

    token = create_jwt({"sub": str(student.id), "type": "student"})

    return {
        "access_token": token,
        "token_type": "bearer",
        "student": student,
    }


async def change_password(
    student_id: str,
    old_password: str,
    new_password: str,
    db: AsyncSession,
) -> dict:
    """淇敼瀵嗙爜"""
    result = await db.execute(select(Student).where(Student.id == _as_uuid(student_id)))
    student = result.scalar_one()

    if old_password and student.password_hash:
        if not verify_password(old_password, student.password_hash):
            raise BadRequestException("鍘熷瘑鐮侀敊璇?")

    student.password_hash = hash_password(new_password)
    student.password_changed_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "瀵嗙爜淇敼鎴愬姛"}
