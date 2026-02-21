from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WechatLoginRequest(BaseModel):
    code: str


class WechatLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool
    student: Optional[dict] = None


class PhoneDecryptRequest(BaseModel):
    encrypted_data: str
    iv: str


class PhoneDecryptResponse(BaseModel):
    phone: str
