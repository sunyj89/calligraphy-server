import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sms_code import SmsCode


DEV_CODE = "888888"


async def send_sms_code(phone: str, purpose: str, db: AsyncSession) -> dict:
    """发送短信验证码"""
    is_dev = os.getenv("ENV", "production") != "production"
    
    code = DEV_CODE if is_dev else _generate_code()
    
    sms_record = SmsCode(
        phone=phone,
        code=code,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5)
    )
    db.add(sms_record)
    await db.commit()
    
    if is_dev:
        return {"message": f"开发环境验证码: {code}"}
    return {"message": "验证码已发送"}


def _generate_code() -> str:
    """生成6位随机验证码"""
    import random
    return ''.join(random.choices('0123456789', k=6))


async def verify_sms_code(phone: str, code: str, purpose: str, db: AsyncSession) -> bool:
    """验证短信验证码"""
    result = await db.execute(
        select(SmsCode).where(
            SmsCode.phone == phone,
            SmsCode.code == code,
            SmsCode.purpose == purpose,
            SmsCode.expires_at > datetime.now(timezone.utc),
            SmsCode.used_at == None
        )
    )
    record = result.scalar_one_or_none()
    if record:
        record.used_at = datetime.now(timezone.utc)
        await db.commit()
        return True
    return False
