from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_jwt, hash_password, verify_password
from app.models.user import Teacher


async def teacher_login(phone: str, password: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(Teacher).where(Teacher.phone == phone, Teacher.is_active == True)
    )
    teacher = result.scalar_one_or_none()
    if not teacher or not verify_password(password, teacher.password_hash):
        raise UnauthorizedException("invalid phone or password")

    token = create_jwt({"sub": str(teacher.id), "type": "teacher"})
    return {"access_token": token, "token_type": "bearer", "teacher": teacher}


async def change_password(
    teacher_id: str,
    old_password: str,
    new_password: str,
    db: AsyncSession,
) -> dict:
    result = await db.execute(select(Teacher).where(Teacher.id == teacher_id))
    teacher = result.scalar_one()
    if not verify_password(old_password, teacher.password_hash):
        raise BadRequestException("old password is incorrect")

    teacher.password_hash = hash_password(new_password)
    teacher.password_changed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "password updated"}


async def create_teacher(name: str, phone: str, password: str, db: AsyncSession) -> Teacher:
    result = await db.execute(select(Teacher).where(Teacher.phone == phone))
    if result.scalar_one_or_none():
        raise BadRequestException("phone already exists")

    teacher = Teacher(name=name, phone=phone, password_hash=hash_password(password))
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher
