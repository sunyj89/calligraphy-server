import asyncio
from datetime import date
from typing import Iterable
from uuid import UUID

from sqlalchemy import delete, select
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
DEMO_SCHOOL = "\u9752\u7a1a\u4e66\u9662[demo]"
DEMO_STUDENT_PHONE_PREFIX = "1379000"

DEMO_TEACHERS = [
    {"name": "\u6f14\u793a\u7ba1\u7406\u5458", "phone": "13990000001", "role": "admin", "password": "admin123"},
    {"name": "\u5218\u8001\u5e08", "phone": "13990000002", "role": "teacher", "password": "123456"},
    {"name": "\u9648\u8001\u5e08", "phone": "13990000003", "role": "teacher", "password": "123456"},
    {"name": "\u738b\u8001\u5e08", "phone": "13990000004", "role": "teacher", "password": "123456"},
]

DEMO_CLASSROOMS = [
    ("\u542f\u8499\u4e00\u73ed", "1"),
    ("\u8fdb\u9636\u4e8c\u73ed", "2"),
    ("\u63d0\u5347\u4e09\u73ed", "3"),
    ("\u521b\u4f5c\u56db\u73ed", "4"),
]

DEMO_BOOKS = [
    ("\u57fa\u7840\u63a7\u7b14", 1),
    ("\u504f\u65c1\u7ed3\u6784", 2),
    ("\u7ae0\u6cd5\u8bad\u7ec3", 3),
    ("\u521b\u4f5c\u63d0\u5347", 4),
]

DEMO_STAGE_PROFILES = [
    {"name": "\u674e\u6c90\u9633", "gender": "male", "target_total": 1200, "term": "spring"},
    {"name": "\u5f20\u4e66\u6db5", "gender": "female", "target_total": 2000, "term": "spring"},
    {"name": "\u738b\u6893\u8f69", "gender": "male", "target_total": 3400, "term": "summer"},
    {"name": "\u9648\u8bed\u5f64", "gender": "female", "target_total": 5000, "term": "summer"},
    {"name": "\u8d75\u5609\u5b81", "gender": "male", "target_total": 6500, "term": "autumn"},
    {"name": "\u5218\u829d\u82e5", "gender": "female", "target_total": 8000, "term": "autumn"},
    {"name": "\u5468\u5955\u8fb0", "gender": "male", "target_total": 9500, "term": "autumn"},
]


def _demo_student_phone(index: int) -> str:
    return f"{DEMO_STUDENT_PHONE_PREFIX}{index:04d}"


def _uuid(value: str) -> UUID:
    return UUID(value)


async def _current_total(student_id: str, db: AsyncSession) -> int:
    row = await db.execute(select(Student.total_score).where(Student.id == _uuid(student_id)))
    return int(row.scalar_one())


def _extract_ids(query_rows: Iterable) -> list:
    return [row[0] for row in query_rows]


async def clear_demo_data(db: AsyncSession) -> None:
    teacher_ids = _extract_ids(
        (
            await db.execute(
                select(Teacher.id).where(Teacher.phone.in_([item["phone"] for item in DEMO_TEACHERS]))
            )
        ).all()
    )
    classroom_ids = _extract_ids(
        (await db.execute(select(Classroom.id).where(Classroom.description.like(f"%{DEMO_TAG}%")))).all()
    )
    student_ids = _extract_ids(
        (
            await db.execute(
                select(Student.id).where(
                    Student.phone.like(f"{DEMO_STUDENT_PHONE_PREFIX}%"),
                    Student.school == DEMO_SCHOOL,
                )
            )
        ).all()
    )
    book_ids = _extract_ids(
        (await db.execute(select(Book.id).where(Book.description.like(f"%{DEMO_TAG}%")))).all()
    )
    work_ids = _extract_ids(
        (
            await db.execute(
                select(Work.id).where(Work.student_id.in_(student_ids) if student_ids else False)
            )
        ).all()
    )

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


async def _seed_student_growth(
    student: Student,
    teacher: Teacher,
    books: list[Book],
    target_total: int,
    term: str,
    index: int,
    db: AsyncSession,
) -> None:
    practice_score_pool = [70, 50, 20, 5, 70, 50, 20]
    practice_score = practice_score_pool[index]
    target_part = "root" if index < 4 else "trunk"

    await add_score(
        student_id=str(student.id),
        teacher_id=str(teacher.id),
        score_type="practice",
        score=practice_score,
        reason="\u8bfe\u5802\u7ec3\u4e60",
        db=db,
        term=term,
        target_part=target_part,
        book_id=str(books[index % len(books)].id),
    )
    await add_score(
        student_id=str(student.id),
        teacher_id=str(teacher.id),
        score_type="homework",
        score=30 + index * 5,
        reason="\u8bfe\u540e\u4f5c\u4e1a",
        db=db,
        term=term,
    )
    await add_score(
        student_id=str(student.id),
        teacher_id=str(teacher.id),
        score_type="competition",
        score=60 + index * 5,
        reason="\u9636\u6bb5\u6d4b\u8bc4",
        db=db,
        term=term,
    )
    await create_or_replace_work(
        student_id=str(student.id),
        teacher_id=str(teacher.id),
        data={
            "term": term,
            "slot_index": 1,
            "gallery_scope": "classroom" if index % 3 else "both",
            "image_url": f"/uploads/demo-{index + 1}-slot1.jpg",
            "description": f"{student.name} \u4f5c\u54c1\u4e00",
            "score": 75 + (index % 4) * 5,
        },
        db=db,
    )
    if index % 2 == 0:
        await create_or_replace_work(
            student_id=str(student.id),
            teacher_id=str(teacher.id),
            data={
                "term": term,
                "slot_index": 2,
                "gallery_scope": "school" if index >= 4 else "both",
                "image_url": f"/uploads/demo-{index + 1}-slot2.jpg",
                "description": f"{student.name} \u4f5c\u54c1\u4e8c",
                "score": 80 + (index % 3) * 4,
            },
            db=db,
        )

    while True:
        remaining = target_total - await _current_total(str(student.id), db)
        if remaining <= 0:
            break
        await add_score(
            student_id=str(student.id),
            teacher_id=str(teacher.id),
            score_type="competition",
            score=min(100, remaining),
            reason="\u9636\u6bb5\u8865\u5206",
            db=db,
            term=term,
        )

    final_total = await _current_total(str(student.id), db)
    if final_total != target_total:
        raise RuntimeError(f"demo profile total mismatch for {student.name}: {final_total} != {target_total}")


async def seed_demo_data(db: AsyncSession) -> None:
    await clear_demo_data(db)

    teachers: list[Teacher] = []
    for item in DEMO_TEACHERS:
        teacher = Teacher(
            name=item["name"],
            phone=item["phone"],
            password_hash=hash_password(item["password"]),
            role=item["role"],
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
            description=f"{name} {DEMO_TAG}",
            teacher_id=teacher_pool[index % len(teacher_pool)].id,
        )
        db.add(classroom)
        classrooms.append(classroom)
    await db.flush()

    books: list[Book] = []
    for name, order_num in DEMO_BOOKS:
        book = Book(name=name, order_num=order_num, description=f"{name} {DEMO_TAG}")
        db.add(book)
        books.append(book)
    await db.flush()

    students: list[Student] = []
    for index, profile in enumerate(DEMO_STAGE_PROFILES):
        classroom = classrooms[index % len(classrooms)]
        teacher = teacher_pool[index % len(teacher_pool)]
        student = Student(
            name=profile["name"],
            phone=_demo_student_phone(index + 1),
            password_hash=hash_password("111111"),
            grade=classroom.grade_year or "1",
            gender=profile["gender"],
            birthday=date(2012 + (index % 4), (index % 12) + 1, (index % 20) + 1),
            school=DEMO_SCHOOL,
            address="\u4e0a\u6d77\u5e02\u9759\u5b89\u533a\u793a\u8303\u8def88\u53f7",
            classroom_id=classroom.id,
            created_by=teacher.id,
        )
        db.add(student)
        students.append(student)
    await db.commit()

    for index, student in enumerate(students):
        profile = DEMO_STAGE_PROFILES[index]
        teacher = teacher_pool[index % len(teacher_pool)]
        await _seed_student_growth(
            student=student,
            teacher=teacher,
            books=books,
            target_total=profile["target_total"],
            term=profile["term"],
            index=index,
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
