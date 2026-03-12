import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models import Book, Classroom, Student, Teacher
from app.models.base import Base
from scripts.seed_demo_data import seed_demo_data

BASE_BOOKS = [
    {"name": "第一册-基础笔画(一)", "order_num": 1, "description": "横竖撇捺基础训练"},
    {"name": "第二册-基础笔画(二)", "order_num": 2, "description": "点折钩提进阶训练"},
    {"name": "第三册-简单汉字(一)", "order_num": 3, "description": "常用汉字起步"},
    {"name": "第四册-简单汉字(二)", "order_num": 4, "description": "自然主题汉字"},
]


async def init_db() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        admin = Teacher(
            name="管理员",
            phone="13900000000",
            password_hash=hash_password("admin123"),
            role="admin",
        )
        teacher = Teacher(
            name="张老师",
            phone="13800000000",
            password_hash=hash_password("123456"),
            role="teacher",
        )
        session.add_all([admin, teacher])
        await session.flush()

        classroom = Classroom(
            name="一年级1班",
            grade_year="1",
            description="系统默认演示班级",
            teacher_id=teacher.id,
        )
        session.add(classroom)
        await session.flush()

        for book_data in BASE_BOOKS:
            session.add(Book(**book_data))

        session.add(
            Student(
                name="测试学生",
                phone="13700000000",
                password_hash=hash_password("111111"),
                grade="1",
                gender="male",
                classroom_id=classroom.id,
                created_by=teacher.id,
            )
        )
        await session.commit()
        await seed_demo_data(session)

    print("Database initialized.")
    print("Base admin: 13900000000 / admin123")
    print("Base teacher: 13800000000 / 123456")
    print("Base student: 13700000000 / 111111")
    print("Demo admin: 13990000001 / admin123")
    print("Demo teachers: 13990000002 / 123456, 13990000003 / 123456")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())
