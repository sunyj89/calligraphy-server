import asyncio
from datetime import date

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models import (
    Book,
    Classroom,
    ScoreRecord,
    Student,
    StudentBookScore,
    Teacher,
    Work,
    WorkHistory,
)
from app.services.score_service import add_score
from app.services.work_service import create_or_replace_work

DEMO_TAG = "[demo]"
DEMO_TEACHERS = [
    ("演示管理员", "13990000001", "admin", "admin123"),
    ("程老师", "13990000002", "teacher", "123456"),
    ("张老师", "13990000003", "teacher", "123456"),
]
DEMO_CLASSROOMS = [
    ("启蒙一班", "1"),
    ("启蒙二班", "1"),
    ("进阶二班", "2"),
    ("进阶三班", "3"),
    ("高阶四班", "4"),
    ("高阶五班", "5"),
]
DEMO_BOOKS = [
    ("控笔基础", 1),
    ("基础笔画一", 2),
    ("基础笔画二", 3),
    ("偏旁部首", 4),
    ("结构训练", 5),
    ("章法练习", 6),
    ("创作提升", 7),
    ("比赛专项", 8),
]


def _demo_student_phone(index: int) -> str:
    return f"1379000{index:04d}"


def _book_limit_for_grade(grade: str) -> int:
    if grade == "1":
        return 6
    if grade == "2":
        return 8
    if grade == "3":
        return 10
    return 12


async def clear_demo_data(db: AsyncSession) -> None:
    teacher_ids = [
        row[0]
        for row in (
            await db.execute(select(Teacher.id).where(Teacher.phone.in_([item[1] for item in DEMO_TEACHERS])))
        ).all()
    ]
    student_ids = [
        row[0]
        for row in (
            await db.execute(select(Student.id).where(Student.phone.like("1379000%")))
        ).all()
    ]
    classroom_ids = [
        row[0]
        for row in (
            await db.execute(select(Classroom.id).where(Classroom.description.like(f"%{DEMO_TAG}%")))
        ).all()
    ]
    book_ids = [
        row[0]
        for row in (
            await db.execute(select(Book.id).where(Book.description.like(f"%{DEMO_TAG}%")))
        ).all()
    ]
    work_ids = [
        row[0]
        for row in (
            await db.execute(
                select(Work.id).where(or_(Work.student_id.in_(student_ids), Work.teacher_id.in_(teacher_ids)))
            )
        ).all()
    ]

    if work_ids:
        await db.execute(delete(WorkHistory).where(WorkHistory.work_id.in_(work_ids)))
    if student_ids:
        await db.execute(delete(ScoreRecord).where(ScoreRecord.student_id.in_(student_ids)))
        await db.execute(delete(StudentBookScore).where(StudentBookScore.student_id.in_(student_ids)))
        await db.execute(delete(Work).where(Work.student_id.in_(student_ids)))
        await db.execute(delete(Student).where(Student.id.in_(student_ids)))
    if classroom_ids:
        await db.execute(delete(Classroom).where(Classroom.id.in_(classroom_ids)))
    if book_ids:
        await db.execute(delete(Book).where(Book.id.in_(book_ids)))
    if teacher_ids:
        await db.execute(delete(Teacher).where(Teacher.id.in_(teacher_ids)))
    await db.commit()


async def seed_demo_data(db: AsyncSession) -> None:
    await clear_demo_data(db)

    teachers: list[Teacher] = []
    for name, phone, role, password in DEMO_TEACHERS:
        teacher = Teacher(
            name=name,
            phone=phone,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(teacher)
        teachers.append(teacher)
    await db.flush()
    teacher_pool = [teacher for teacher in teachers if teacher.role == "teacher"]

    classrooms: list[Classroom] = []
    for index, (name, grade_year) in enumerate(DEMO_CLASSROOMS):
        classroom = Classroom(
            name=name,
            grade_year=grade_year,
            description=f"{DEMO_TAG} {name}",
            teacher_id=teacher_pool[index % len(teacher_pool)].id,
        )
        db.add(classroom)
        classrooms.append(classroom)
    await db.flush()

    books: list[Book] = []
    for name, order_num in DEMO_BOOKS:
        book = Book(name=name, order_num=order_num, description=f"{DEMO_TAG} {name}")
        db.add(book)
        books.append(book)
    await db.flush()

    students: list[Student] = []
    for index in range(18):
        classroom = classrooms[index % len(classrooms)] if index < 16 else None
        grade = classroom.grade_year if classroom else str(1 + (index % 4))
        student = Student(
            name=f"演示学生{index + 1:02d}",
            phone=_demo_student_phone(index + 1),
            password_hash=hash_password("111111"),
            grade=grade,
            gender="male" if index % 2 == 0 else "female",
            birthday=date(2015 + (index % 4), 1 + (index % 6), 1 + (index % 20)),
            school="清韵书院",
            classroom_id=classroom.id if classroom else None,
            created_by=teacher_pool[index % len(teacher_pool)].id,
        )
        db.add(student)
        students.append(student)
    await db.commit()

    terms = ["spring", "summer", "autumn"]
    for index, student in enumerate(students):
        teacher = teacher_pool[index % len(teacher_pool)]
        term = terms[index % len(terms)]

        practice_count = min(4 + (index % 4), len(books), _book_limit_for_grade(student.grade))
        for book_offset in range(practice_count):
            await add_score(
                student_id=str(student.id),
                teacher_id=str(teacher.id),
                score_type="practice",
                score=[5, 20, 50, 70][(index + book_offset) % 4],
                reason=f"演示练习{book_offset + 1}",
                db=db,
                term=term,
                target_part="root" if book_offset % 2 == 0 else "trunk",
                book_id=str(books[book_offset].id),
            )

        for homework_index in range(2 + (index % 4)):
            await add_score(
                student_id=str(student.id),
                teacher_id=str(teacher.id),
                score_type="homework",
                score=10 + homework_index,
                reason=f"演示作业{homework_index + 1}",
                db=db,
                term=term,
            )

        await add_score(
            student_id=str(student.id),
            teacher_id=str(teacher.id),
            score_type="competition",
            score=60 + (index % 5) * 8,
            reason="演示比赛",
            db=db,
            term=term,
        )

        if index < 10:
            await create_or_replace_work(
                student_id=str(student.id),
                teacher_id=str(teacher.id),
                data={
                    "term": term,
                    "slot_index": 1,
                    "gallery_scope": "classroom" if index % 3 == 0 else "both",
                    "image_url": f"/uploads/demo-work-{index + 1}-1.jpg",
                    "description": f"演示作品位1-{index + 1}",
                    "score": 72 + (index % 5) * 5,
                },
                db=db,
            )
        if index < 6:
            await create_or_replace_work(
                student_id=str(student.id),
                teacher_id=str(teacher.id),
                data={
                    "term": term,
                    "slot_index": 2,
                    "gallery_scope": "school" if index % 2 == 0 else "both",
                    "image_url": f"/uploads/demo-work-{index + 1}-2.jpg",
                    "description": f"演示作品位2-{index + 1}",
                    "score": 80 + (index % 4) * 4,
                },
                db=db,
            )
        if index == 0:
            await create_or_replace_work(
                student_id=str(student.id),
                teacher_id=str(teacher.id),
                data={
                    "term": term,
                    "slot_index": 1,
                    "gallery_scope": "both",
                    "image_url": "/uploads/demo-work-1-1-replaced.jpg",
                    "description": "演示作品替换后",
                    "score": 96,
                },
                db=db,
            )


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        await seed_demo_data(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
