from pathlib import Path

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.redis import get_redis
from app.core.security import hash_password
from app.main import app
from app.models import Book, Student, Teacher
from app.models.base import Base, get_db


@pytest.fixture(scope="session")
async def db_engine(tmp_path_factory: pytest.TempPathFactory):
    db_dir = tmp_path_factory.mktemp("db")
    db_path = Path(db_dir) / "test.sqlite3"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
def session_factory(db_engine):
    return async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


async def _seed_database(session: AsyncSession):
    admin = Teacher(
        name="Admin",
        phone="13900000000",
        password_hash=hash_password("admin123"),
        role="admin",
    )
    teacher = Teacher(
        name="Teacher Zhang",
        phone="13800000000",
        password_hash=hash_password("teacher123"),
        role="teacher",
    )
    student = Student(
        name="Test Student",
        phone="13700000000",
        password_hash=hash_password("test123456"),
        total_score=4587,
        root_score=2000,
        trunk_score=1500,
        leaf_count=8,
        fruit_count=1,
        stage="small",
        is_senior=False,
        ever_reached_senior=False,
    )
    books = [
        Book(name="Book One", order_num=1, description="Basic strokes"),
        Book(name="Book Two", order_num=2, description="Advanced strokes"),
    ]

    session.add_all([admin, teacher, student, *books])
    await session.commit()


@pytest.fixture(autouse=True)
async def reset_database(db_engine):
    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    seed_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with seed_factory() as session:
        await _seed_database(session)


@pytest.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    try:
        yield redis
    finally:
        await redis.flushall()
        await redis.aclose()


@pytest.fixture
async def client(session_factory, fake_redis):
    async def override_get_db():
        async with session_factory() as session:
            yield session

    async def override_get_redis():
        return fake_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_teacher(db: AsyncSession):
    teacher = Teacher(
        name="Test Teacher",
        phone="13899990000",
        password_hash=hash_password("password123"),
        role="teacher",
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher
