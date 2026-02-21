from typing import Optional
import jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import uuid
from app.core.config import settings

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_jwt(data: dict, expires_delta: Optional[int] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.now(timezone.utc)})
    
    jti = str(uuid.uuid4())
    to_encode.update({"jti": jti})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token已过期")
    except jwt.InvalidTokenError:
        raise ValueError("无效Token")


async def add_to_blacklist(jti: str, redis_client) -> None:
    await redis_client.setex(f"blacklist:{jti}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "1")


async def is_blacklisted(jti: str, redis_client) -> bool:
    return await redis_client.exists(f"blacklist:{jti}") > 0
