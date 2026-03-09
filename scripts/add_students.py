import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.student import Student
from app.core.security import hash_password
from app.core.config import settings


# 10个不同等级的学员数据
STUDENTS_DATA = [
    {
        "name": "李小明",
        "phone": "13600000001",
        "password": "student123",
        "total_score": 500,
        "root_score": 300,
        "trunk_score": 200,
        "leaf_count": 0,
        "fruit_count": 0,
        "stage": "sprout",  # 萌芽宝宝 (0-1499)
        "is_senior": False,
        "gender": "male",
        "school": "实验小学",
        "grade": "一年级"
    },
    {
        "name": "王小红",
        "phone": "13600000002",
        "password": "student123",
        "total_score": 2000,
        "root_score": 1000,
        "trunk_score": 1000,
        "leaf_count": 0,
        "fruit_count": 0,
        "stage": "seedling",  # 努力伸腰 (1500-2999)
        "is_senior": False,
        "gender": "female",
        "school": "实验小学",
        "grade": "二年级"
    },
    {
        "name": "张伟",
        "phone": "13600000003",
        "password": "student123",
        "total_score": 3500,
        "root_score": 1500,
        "trunk_score": 1500,
        "leaf_count": 5,
        "fruit_count": 0,
        "stage": "small",  # 撑起小伞 (3000-4499)
        "is_senior": False,
        "gender": "male",
        "school": "育才小学",
        "grade": "三年级"
    },
    {
        "name": "刘芳",
        "phone": "13600000004",
        "password": "student123",
        "total_score": 5200,
        "root_score": 2500,
        "trunk_score": 2200,
        "leaf_count": 5,
        "fruit_count": 0,
        "stage": "medium",  # 有模有样 (4500-5999)
        "is_senior": True,
        "gender": "female",
        "school": "育才小学",
        "grade": "四年级"
    },
    {
        "name": "陈浩",
        "phone": "13600000005",
        "password": "student123",
        "total_score": 6800,
        "root_score": 3000,
        "trunk_score": 2500,
        "leaf_count": 13,
        "fruit_count": 0,
        "stage": "large",  # 披上绿袍 (6000-7499)
        "is_senior": True,
        "gender": "male",
        "school": "明德小学",
        "grade": "五年级"
    },
    {
        "name": "赵敏",
        "phone": "13600000006",
        "password": "student123",
        "total_score": 8200,
        "root_score": 3500,
        "trunk_score": 3000,
        "leaf_count": 17,
        "fruit_count": 0,
        "stage": "xlarge",  # 绿意满满 (7500-8999)
        "is_senior": True,
        "gender": "female",
        "school": "明德小学",
        "grade": "六年级"
    },
    {
        "name": "孙强",
        "phone": "13600000007",
        "password": "student123",
        "total_score": 9500,
        "root_score": 4000,
        "trunk_score": 3500,
        "leaf_count": 20,
        "fruit_count": 0,
        "stage": "fruitful",  # 硕果累累 (9000+)
        "is_senior": True,
        "gender": "male",
        "school": "新华小学",
        "grade": "六年级"
    },
    {
        "name": "周婷",
        "phone": "13600000008",
        "password": "student123",
        "total_score": 10500,
        "root_score": 4500,
        "trunk_score": 4000,
        "leaf_count": 20,
        "fruit_count": 0,
        "stage": "fruitful",  # 硕果累累 (9000+)
        "is_senior": True,
        "gender": "female",
        "school": "新华小学",
        "grade": "五年级"
    },
    {
        "name": "吴磊",
        "phone": "13600000009",
        "password": "student123",
        "total_score": 1200,
        "root_score": 700,
        "trunk_score": 500,
        "leaf_count": 0,
        "fruit_count": 0,
        "stage": "sprout",  # 萌芽宝宝 (0-1499)
        "is_senior": False,
        "gender": "male",
        "school": "阳光小学",
        "grade": "一年级"
    },
    {
        "name": "郑雪",
        "phone": "13600000010",
        "password": "student123",
        "total_score": 4200,
        "root_score": 2000,
        "trunk_score": 1800,
        "leaf_count": 4,
        "fruit_count": 0,
        "stage": "small",  # 撑起小伞 (3000-4499)
        "is_senior": False,
        "gender": "female",
        "school": "阳光小学",
        "grade": "三年级"
    }
]


async def add_students():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        for student_data in STUDENTS_DATA:
            password = student_data.pop("password")
            student = Student(
                **student_data,
                password_hash=hash_password(password),
                ever_reached_senior=student_data["is_senior"]
            )
            session.add(student)
            print(f"添加学员: {student.name} - {student.phone} - 等级: {student.stage} - 总分: {student.total_score}")

        await session.commit()

    print(f"\n成功添加 {len(STUDENTS_DATA)} 个学员！")
    print("所有学员密码均为: student123")
    print("\n学员列表:")
    for i, student in enumerate(STUDENTS_DATA, 1):
        print(f"{i}. {student['name']} ({student['phone']}) - {student['stage']} - {student['total_score']}分")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(add_students())
