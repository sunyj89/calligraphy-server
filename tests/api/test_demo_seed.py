from sqlalchemy import func, select

from app.core.security import hash_password
from app.models import Classroom, ScoreRecord, Student, StudentBookScore, Teacher, Work
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
    grade_count = (
        await db.execute(select(func.count(func.distinct(Student.grade))).where(Student.phone.like("1379%")))
    ).scalar_one()
    stage_count = (
        await db.execute(select(func.count(func.distinct(Student.stage))).where(Student.phone.like("1379%")))
    ).scalar_one()
    lit_book_count = (
        await db.execute(select(func.count()).select_from(StudentBookScore))
    ).scalar_one()
    work_score_count = (
        await db.execute(
            select(func.count()).select_from(ScoreRecord).where(ScoreRecord.score_type == "work")
        )
    ).scalar_one()

    assert teacher_count >= 3
    assert classroom_count >= 6
    assert student_count >= 18
    assert work_count >= 8
    assert score_count >= 40
    assert grade_count >= 4
    assert stage_count >= 4
    assert lit_book_count >= 12
    assert work_score_count >= 8


async def test_demo_seed_covers_lit_and_unlit_books_and_multiple_rankings(db):
    await seed_demo_data(db)

    demo_students = (
        await db.execute(select(Student).where(Student.phone.like("1379%")).order_by(Student.total_score.desc()))
    ).scalars().all()
    classroom_students = [student for student in demo_students if student.classroom_id is not None]
    unassigned_students = [student for student in demo_students if student.classroom_id is None]
    stage_set = {student.stage for student in demo_students}
    lit_counts = {
        str(student.id): (
            await db.execute(
                select(func.count())
                .select_from(StudentBookScore)
                .where(StudentBookScore.student_id == student.id)
            )
        ).scalar_one()
        for student in demo_students
    }

    assert len(classroom_students) >= 12
    assert len(unassigned_students) >= 2
    assert {"sprout", "seedling", "small", "medium"}.issubset(stage_set)
    assert any(count == 0 for count in lit_counts.values())
    assert any(count > 0 for count in lit_counts.values())


async def test_demo_cleanup_only_removes_demo_records(db):
    organic_teacher = Teacher(
        name="Organic Teacher",
        phone="18800000000",
        password_hash=hash_password("123456"),
        role="teacher",
    )
    db.add(organic_teacher)
    await db.commit()

    organic_classroom = Classroom(
        name="Organic Class",
        grade_year="3",
        description="production class",
        teacher_id=organic_teacher.id,
    )
    db.add(organic_classroom)
    await db.flush()

    organic_student = Student(
        name="Organic Student",
        phone="18810000000",
        password_hash=hash_password("123456"),
        grade="3",
        gender="female",
        school="Production School",
        classroom_id=organic_classroom.id,
        created_by=organic_teacher.id,
    )
    db.add(organic_student)
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
    remaining_organic_student = (
        await db.execute(select(Student).where(Student.phone == "18810000000"))
    ).scalar_one_or_none()
    remaining_organic_classroom = (
        await db.execute(select(Classroom).where(Classroom.name == "Organic Class"))
    ).scalar_one_or_none()

    assert remaining_demo_students == 0
    assert remaining_demo_classrooms == 0
    assert remaining_organic is not None
    assert remaining_organic_student is not None
    assert remaining_organic_classroom is not None
