import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.student import Student
from app.core.security import create_jwt
from app.core.exceptions import BadRequestException
from app.core.config import settings
from datetime import datetime, timezone
import base64
import json
from Crypto.Cipher import AES


async def wechat_login(code: str, db: AsyncSession, redis) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.weixin.qq.com/sns/jscode2session",
            params={
                "appid": settings.WECHAT_APPID,
                "secret": settings.WECHAT_SECRET,
                "js_code": code,
                "grant_type": "authorization_code"
            }
        )
        wx_data = response.json()
    
    if settings.WECHAT_APPID == "mock_appid":
        openid = f"mock_openid_{code}"
        session_key = "mock_session_key"
        unionid = None
    else:
        openid = wx_data.get("openid")
        session_key = wx_data.get("session_key")
        unionid = wx_data.get("unionid")
    
    if not openid or not session_key:
        raise BadRequestException("微信登录失败")
    
    result = await db.execute(
        select(Student).where(Student.openid == openid, Student.is_active == True)
    )
    student = result.scalar_one_or_none()
    
    is_new_user = False
    if not student:
        is_new_user = True
        student = Student(
            openid=openid,
            unionid=unionid,
            name="微信用户",
            is_active=True
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)
    
    await redis.setex(
        f"wx_session:{student.id}",
        1800,
        session_key
    )
    
    token = create_jwt({
        "sub": str(student.id),
        "type": "student"
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "is_new_user": is_new_user,
        "student": student
    }


async def decrypt_phone_number(student_id: str, encrypted_data: str, iv: str, redis) -> str:
    session_key = await redis.get(f"wx_session:{student_id}")
    if not session_key:
        raise BadRequestException("session_key已过期，请重新登录")
    
    if settings.WECHAT_APPID == "mock_appid":
        return "13800000000"
    
    try:
        session_key_bytes = base64.b64decode(session_key)
        encrypted_bytes = base64.b64decode(encrypted_data)
        iv_bytes = base64.b64decode(iv)
        
        cipher = AES.new(session_key_bytes, AES.MODE_CBC, iv_bytes)
        decrypted_bytes = cipher.decrypt(encrypted_bytes)
        
        pad_len = decrypted_bytes[-1]
        decrypted_bytes = decrypted_bytes[:-pad_len]
        
        phone_data = json.loads(decrypted_bytes.decode('utf-8'))
        return phone_data.get("phoneNumber")
    
    except Exception as e:
        raise BadRequestException(f"手机号解密失败: {str(e)}")
