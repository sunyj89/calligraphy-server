from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.student import Student
from app.core.security import verify_password, hash_password, create_jwt
from app.core.exceptions import UnauthorizedException, BadRequestException, NotFoundException
from app.services import sms_service
from datetime import datetime, timezone


async def student_register(phone: str, code: str, password: str, name: str, db: AsyncSession) -> dict:
    """学生注册"""
    if not await sms_service.verify_sms_code(phone, code, "register", db):
        raise BadRequestException("验证码错误或已过期")
    
    result = await db.execute(select(Student).where(Student.phone == phone))
    if result.scalar_one_or_none():
        raise BadRequestException("手机号已注册")
    
    student = Student(
        phone=phone,
        name=name,
        password_hash=hash_password(password)
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    token = create_jwt({
        "sub": str(student.id),
        "type": "student"
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": student
    }


async def student_login(phone: str, password: str, db: AsyncSession) -> dict:
    """学生账号密码登录"""
    result = await db.execute(select(Student).where(Student.phone == phone, Student.is_active == True))
    student = result.scalar_one_or_none()
    
    if not student or not student.password_hash:
        raise UnauthorizedException("手机号或密码错误")
    
    if not verify_password(password, student.password_hash):
        raise UnauthorizedException("手机号或密码错误")
    
    token = create_jwt({
        "sub": str(student.id),
        "type": "student"
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": student
    }


async def student_sms_login(phone: str, code: str, db: AsyncSession) -> dict:
    """学生短信验证码登录"""
    if not await sms_service.verify_sms_code(phone, code, "login", db):
        raise BadRequestException("验证码错误或已过期")
    
    result = await db.execute(select(Student).where(Student.phone == phone, Student.is_active == True))
    student = result.scalar_one_or_none()
    
    if not student:
        raise NotFoundException("该手机号未注册")
    
    token = create_jwt({
        "sub": str(student.id),
        "type": "student"
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "student": student
    }


async def change_password(student_id: str, old_password: str, new_password: str, db: AsyncSession) -> dict:
    """修改密码"""
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one()
    
    if old_password and student.password_hash:
        if not verify_password(old_password, student.password_hash):
            raise BadRequestException("原密码错误")
    
    student.password_hash = hash_password(new_password)
    student.password_changed_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"message": "密码修改成功"}


async def change_phone(student_id: str, new_phone: str, code: str, db: AsyncSession) -> dict:
    """修改手机号"""
    if not await sms_service.verify_sms_code(new_phone, code, "change_phone", db):
        raise BadRequestException("验证码错误或已过期")
    
    result = await db.execute(select(Student).where(Student.phone == new_phone))
    if result.scalar_one_or_none():
        raise BadRequestException("该手机号已被使用")
    
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one()
    student.phone = new_phone
    await db.commit()
    
    return {"message": "手机号修改成功"}
