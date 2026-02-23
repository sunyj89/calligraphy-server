import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models import Student, Teacher, Book, Classroom, ScoreRecord, Work, AuditLog, SmsCode


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_teacher(db):
    from app.services.auth_service import create_teacher
    teacher = await create_teacher("测试教师", "13800000000", "password123", db)
    return teacher
