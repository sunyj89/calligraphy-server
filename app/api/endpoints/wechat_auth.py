from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.api.dependencies import get_current_student
from app.models.student import Student
from app.schemas.wechat import WechatLoginRequest, WechatLoginResponse, PhoneDecryptRequest, PhoneDecryptResponse
from app.services import wechat_service
from app.core.redis import get_redis

router = APIRouter(prefix="/api/auth/wechat", tags=["微信认证"])


@router.post("/login", response_model=WechatLoginResponse)
async def wechat_login(
    request: WechatLoginRequest,
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    result = await wechat_service.wechat_login(request.code, db, redis)
    return result


@router.post("/phone", response_model=PhoneDecryptResponse)
async def get_phone(
    request: PhoneDecryptRequest,
    current_student: Student = Depends(get_current_student),
    redis=Depends(get_redis)
):
    phone = await wechat_service.decrypt_phone_number(
        str(current_student.id),
        request.encrypted_data,
        request.iv,
        redis
    )
    return {"phone": phone}
