from sqlalchemy import func, select

from app.core.security import hash_password
from app.models import Classroom, ScoreRecord, Student, Teacher, Work
from scripts.seed_demo_data import clear_demo_data, seed_demo_data


async def test_demo_seed_creates_rich_uat_dataset(db):
    await seed_demo_data(db)

    teacher_count = (
        await db.execute(
            select(func.count()).select_from(Teacher).where(Teacher.phone.like("1399%"))
        )
    ).scalar_one()
    classroom_count = (
        await db.execute(
            select(func.count()).select_from(Classroom).where(Classroom.description.like("%[demo]%"))
        )
    ).scalar_one()
    student_count = (
        await db.execute(
            select(func.count()).select_from(Student).where(Student.phone.like("1379%"))
        )
    ).scalar_one()
    work_count = (await db.execute(select(func.count()).select_from(Work))).scalar_one()
    score_count = (await db.execute(select(func.count()).select_from(ScoreRecord))).scalar_one()

    assert teacher_count >= 3
    assert classroom_count >= 6
    assert student_count >= 18
    assert work_count >= 8
    assert score_count >= 40


async def test_demo_cleanup_only_removes_demo_records(db):
    organic_teacher = Teacher(
        name="Organic Teacher",
        phone="18800000000",
        password_hash=hash_password("123456"),
        role="teacher",
    )
    db.add(organic_teacher)
    await db.commit()

    await seed_demo_data(db)
    await clear_demo_data(db)

    remaining_demo_students = (
        await db.execute(
            select(func.count()).select_from(Student).where(Student.phone.like("1379%"))
        )
    ).scalar_one()
    remaining_demo_classrooms = (
        await db.execute(
            select(func.count()).select_from(Classroom).where(Classroom.description.like("%[demo]%"))
        )
    ).scalar_one()
    remaining_organic = (
        await db.execute(select(Teacher).where(Teacher.phone == "18800000000"))
    ).scalar_one_or_none()

    assert remaining_demo_students == 0
    assert remaining_demo_classrooms == 0
    assert remaining_organic is not None
