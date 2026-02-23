from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.schemas.student_auth import (
    StudentLoginRequest,
    StudentSmsLoginRequest,
    SmsCodeRequest,
    StudentRegisterRequest,
)
from app.services import student_auth_service, sms_service
from app.api.dependencies import get_current_student
from app.models.student import Student

router = APIRouter(prefix="/api/auth/student", tags=["学生认证"])


@router.post("/login")
async def login(request: StudentLoginRequest, db: AsyncSession = Depends(get_db)):
    return await student_auth_service.student_login(request.phone, request.password, db)


@router.post("/sms-login")
async def sms_login(request: StudentSmsLoginRequest, db: AsyncSession = Depends(get_db)):
    return await student_auth_service.student_sms_login(request.phone, request.code, db)


@router.post("/sms-code")
async def send_sms(request: SmsCodeRequest, db: AsyncSession = Depends(get_db)):
    purpose = request.phone
    return await sms_service.send_sms_code(request.phone, purpose, db)


@router.post("/register")
async def register(request: StudentRegisterRequest, db: AsyncSession = Depends(get_db)):
    return await student_auth_service.student_register(
        request.phone, request.code, request.password, request.name, db
    )


@router.post("/logout")
async def logout(current_student: Student = Depends(get_current_student)):
    return {"message": "退出成功"}
