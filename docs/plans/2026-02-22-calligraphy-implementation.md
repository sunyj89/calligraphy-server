# 书法成长树后端 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成书法成长树小程序后端开发，包括认证、学员管理、积分系统、练习册、作品上传等功能

**Architecture:** FastAPI + PostgreSQL (asyncpg) + Redis，采用分层架构（API/Service/Model），JWT认证 + Token黑名单 + 改密拦截

**Tech Stack:** FastAPI, SQLAlchemy(asyncpg), PyJWT, bcrypt, Redis, Alembic, Poetry

---

## 阶段一：项目初始化与基础架构

### Task 1: 初始化 Poetry 项目

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\pyproject.toml`

**Step 1: 创建 pyproject.toml**

```toml
[tool.poetry]
name = "calligraphy-backend"
version = "1.4.0"
description = "书法成长树小程序后端"
authors = ["Developer"]

[tool.poetry.dependencies]
python = "^3.10"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.25"}
asyncpg = "^0.29.0"
alembic = "^1.13.1"
pydantic = "^2.5.3"
pydantic-settings = "^2.1.0"
pyjwt = "^2.8.0"
bcrypt = "^4.1.2"
redis = "^5.0.1"
httpx = "^0.26.0"
pycryptodome = "^3.20.0"
loguru = "^0.7.2"
python-multipart = "^0.0.6"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.4"
pytest-asyncio = "^0.23.3
pytest-cov = "^4.1.0"
httpx = "^0.26.0"

[tool.poetry.scripts]
app = "app.main:app"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.ruff]
line-length = 100
target-version = "py310"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**Step 2: 安装依赖**

Run: `cd F:\Kimi_Agent_书法成长树小程序\python_server && poetry install`
Expected: 依赖安装成功

---

### Task 2: 创建目录结构

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\main.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\dependencies.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\routers.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\core\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\utils\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\tests\__init__.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\tests\conftest.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\uploads\`

**Step 1: 创建所有目录和 __init__.py 文件**

使用 Bash 批量创建目录结构

---

### Task 3: 核心配置开发

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\core\config.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\core\security.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\core\exceptions.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\core\redis.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\.env.example`

**Step 1: 创建 config.py**

```python
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/calligraphy_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: str = ""
    
    # JWT
    SECRET_KEY: str = "change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # 微信
    WECHAT_APPID: str = "mock_appid"
    WECHAT_SECRET: str = "mock_secret"
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    
    # 环境
    ENVIRONMENT: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
```

**Step 2: 创建 security.py**

```python
import jwt
from datetime import datetime, timezone
from passlib.context import CryptContext
from functools import partial
from app.core.config import settings
from app.core.redis import get_redis

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_jwt(data: dict, expires_delta: int = None) -> str:
    from datetime import timedelta
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    to_encode.update({"iat": datetime.now(timezone.utc)})
    
    import uuid
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


async def add_to_blacklist(jti: str, redis):
    await redis.setex(f"blacklist:{jti}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, "1")


async def is_blacklisted(jti: str, redis) -> bool:
    return await redis.exists(f"blacklist:{jti}") > 0
```

**Step 3: 创建 exceptions.py**

```python
from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "未授权"):
        super().__init__(status_code=401, detail=detail)


class NotFoundException(AppException):
    def __init__(self, detail: str = "资源不存在"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(AppException):
    def __init__(self, detail: str = "请求错误"):
        super().__init__(status_code=400, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "禁止访问"):
        super().__init__(status_code=403, detail=detail)
```

**Step 4: 创建 redis.py**

```python
import redis.asyncio as redis
from app.core.config import settings
from typing import Optional

_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            encoding="utf-8",
            decode_responses=True
        )
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
```

**Step 5: 创建 .env.example**

```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/calligraphy_db
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
WECHAT_APPID=mock_appid
WECHAT_SECRET=mock_secret
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
ENVIRONMENT=development
```

---

### Task 4: 创建 FastAPI 主应用

**Files:**
- Modify: `F:\Kimi_Agent_书法成长树小程序\python_server\app\main.py`

**Step 1: 创建 main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.redis import close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_redis()


app = FastAPI(
    title="书法成长树 API",
    version="1.4.0",
    lifespan=lifespan
)

# CORS 配置 - 必须在所有路由之前
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册（待实现）
from app.api import routers
app.include_router(routers.router)


@app.get("/")
async def root():
    return {"message": "书法成长树 API", "version": "1.4.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

### Task 5: 数据库模型

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\base.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\user.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\student.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\book.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\score_record.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\models\work.py`

**Step 1: 创建 base.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Step 2: 创建 user.py (教师模型)**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(255))
    role = Column(String(20), default='teacher')
    is_active = Column(Boolean, default=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
```

**Step 3: 创建 student.py (学员模型)**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    openid = Column(String(50))
    phone = Column(String(20))
    unionid = Column(String(50))
    name = Column(String(50), nullable=False)
    avatar = Column(String(255))
    address = Column(String(255))
    school = Column(String(100))
    grade = Column(String(50))
    total_score = Column(Integer, default=0)
    root_score = Column(Integer, default=0)
    trunk_score = Column(Integer, default=0)
    leaf_count = Column(Integer, default=0)
    fruit_count = Column(Integer, default=0)
    stage = Column(String(20), default='sprout')
    is_senior = Column(Boolean, default=False)
    ever_reached_senior = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_active = Column(DateTime(timezone=True), nullable=True)
```

**Step 4: 创建 book.py (练习册模型)**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    cover = Column(String(255))
    description = Column(Text)
    order_num = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

**Step 5: 创建 score_record.py (积分记录模型)**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class ScoreRecord(Base):
    __tablename__ = "score_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    score_type = Column(String(20), nullable=False)  # root, trunk, leaf, fruit
    score = Column(Integer, nullable=False)
    reason = Column(String(200))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

**Step 6: 创建 work.py (作品模型)**

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class Work(Base):
    __tablename__ = "works"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=True)
    image_url = Column(String(255), nullable=False)
    thumbnail_url = Column(String(255))
    description = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

---

### Task 6: Pydantic Schema

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\base.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\user.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\student.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\book.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\score.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\work.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\schemas\wechat.py`

**Step 1: 创建 schemas（批量创建基础 Schema 文件）**

需要创建各个模块的 Request/Response Schema

---

## 阶段二：数据库迁移

### Task 7: Alembic 配置

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\alembic.ini`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\alembic\env.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\alembic\script.py.mako`

**Step 1: 初始化 Alembic**

Run: `cd F:\Kimi_Agent_书法成长树小程序\python_server && poetry run alembic init -t async alembic`

**Step 2: 配置 env.py**

配置异步引擎连接

---

### Task 8: Docker 环境

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\docker-compose.yml`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\Dockerfile`

**Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: calligraphy_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## 阶段三：核心接口

### Task 9: 认证接口

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\auth.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\auth_service.py`

**Step 1: 创建认证端点**

实现登录、登出、获取当前用户、修改密码接口

---

### Task 10: 微信认证

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\wechat_auth.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\wechat_service.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\utils\wechat_decrypt.py`

**Step 1: 创建微信服务**

实现微信登录（缓存 session_key）、手机号解密

---

### Task 11: 学员管理

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\students.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\student_service.py`

---

### Task 12: 积分系统

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\scores.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\score_service.py`

---

### Task 13: 练习册

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\books.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\book_service.py`

---

### Task 14: 作品上传

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\works.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\work_service.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\api\endpoints\upload.py`

---

## 阶段四：业务逻辑

### Task 15: 成长阶段计算

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\app\services\growth_service.py`

---

### Task 16: 资深学员逻辑

在 student_service.py 中实现

---

## 阶段五：测试

### Task 17: 单元测试

**Files:**
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\tests\test_auth.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\tests\test_wechat.py`
- Create: `F:\Kimi_Agent_书法成长树小程序\python_server\tests\test_students.py`

---

## 实施顺序

1. Task 1: 初始化 Poetry 项目
2. Task 2: 创建目录结构
3. Task 3: 核心配置开发
4. Task 4: 创建 FastAPI 主应用
5. Task 5: 数据库模型
6. Task 6: Pydantic Schema
7. Task 7: Alembic 配置
8. Task 8: Docker 环境
9. Task 9-14: 核心接口开发
10. Task 15-16: 业务逻辑
11. Task 17: 测试
