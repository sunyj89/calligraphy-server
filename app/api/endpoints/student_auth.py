from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_student
from app.core.redis import get_redis
from app.core.security import add_to_blacklist, decode_jwt
from app.models.base import get_db
from app.models.student import Student
from app.schemas.student_auth import StudentLoginRequest
from app.services import audit_service, student_auth_service

router = APIRouter(prefix="/api/auth/student", tags=["student-auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/student/login")


@router.post("/login")
async def login(
    request: StudentLoginRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await student_auth_service.student_login(request.phone, request.password, db)
    student = payload["student"]
    ip_address = http_request.headers.get("x-forwarded-for") or (
        http_request.client.host if http_request.client else None
    )
    await audit_service.create_login_log(
        db=db,
        account=student.phone,
        platform="student",
        ip_address=ip_address,
        actor_id=str(student.id),
        actor_name=student.name,
    )
    await db.commit()
    return payload


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_student: Student = Depends(get_current_student),
    redis=Depends(get_redis),
):
    token_info = decode_jwt(token)
    jti = token_info.get("jti")
    if jti:
        await add_to_blacklist(jti, redis)
    return {"message": "logout success"}
