from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_student
from app.core.redis import get_redis
from app.core.security import add_to_blacklist, decode_jwt
from app.models.base import get_db
from app.models.student import Student
from app.schemas.student_auth import StudentLoginRequest
from app.services import student_auth_service

router = APIRouter(prefix="/api/auth/student", tags=["student-auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/student/login")


@router.post("/login")
async def login(request: StudentLoginRequest, db: AsyncSession = Depends(get_db)):
    return await student_auth_service.student_login(request.phone, request.password, db)


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
