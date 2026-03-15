from pathlib import Path

from sqlalchemy import func, select

from app.main import UPLOADS_DIR
from app.core.security import hash_password
from app.models import Classroom, ScoreRecord, Student, StudentBookScore, Teacher, Work
from scripts.seed_demo_data import (
    DEMO_IMAGE_FILENAMES,
    DEMO_STAGE_PROFILES,
    clear_demo_data,
    seed_demo_data,
)


async def test_demo_seed_creates_stage_coverage_dataset(db):
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
    work_count = (
        await db.execute(
            select(func.count()).select_from(Work).where(Work.is_active == True)
        )
    ).scalar_one()
    score_count = (
        await db.execute(select(func.count()).select_from(ScoreRecord))
    ).scalar_one()
    grade_count = (
        await db.execute(select(func.count(func.distinct(Student.grade))).where(Student.phone.like("1379%")))
    ).scalar_one()
    stage_values = (
        await db.execute(select(Student.stage).where(Student.phone.like("1379%")))
    ).scalars().all()
    lit_book_count = (await db.execute(select(func.count()).select_from(StudentBookScore))).scalar_one()
    work_score_count = (
        await db.execute(
            select(func.count()).select_from(ScoreRecord).where(ScoreRecord.score_type == "work")
        )
    ).scalar_one()

    assert teacher_count == 4
    assert classroom_count == 4
    assert student_count == 7
    assert work_count >= 7
    assert score_count > 0
    assert grade_count >= 3
    assert set(stage_values) == {"sprout", "seedling", "small", "medium", "large", "xlarge", "fruitful"}
    assert lit_book_count >= 7
    assert work_score_count >= 7


async def test_demo_seed_keeps_growth_totals_consistent_and_covers_lit_unlit(db):
    await seed_demo_data(db)

    demo_students = (
        await db.execute(select(Student).where(Student.phone.like("1379%")).order_by(Student.total_score.desc()))
    ).scalars().all()

    expected_total_by_name = {item["name"]: item["target_total"] for item in DEMO_STAGE_PROFILES}
    for student in demo_students:
        assert student.name in expected_total_by_name
        assert student.total_score == expected_total_by_name[student.name]

        root_total = (
            await db.execute(
                select(func.coalesce(func.sum(StudentBookScore.current_score), 0)).where(
                    StudentBookScore.student_id == student.id,
                    StudentBookScore.target_part == "root",
                )
            )
        ).scalar_one()
        trunk_total = (
            await db.execute(
                select(func.coalesce(func.sum(StudentBookScore.current_score), 0)).where(
                    StudentBookScore.student_id == student.id,
                    StudentBookScore.target_part == "trunk",
                )
            )
        ).scalar_one()
        homework_total = (
            await db.execute(
                select(func.coalesce(func.sum(ScoreRecord.score), 0)).where(
                    ScoreRecord.student_id == student.id,
                    ScoreRecord.score_type == "homework",
                )
            )
        ).scalar_one()
        competition_total = (
            await db.execute(
                select(func.coalesce(func.sum(ScoreRecord.score), 0)).where(
                    ScoreRecord.student_id == student.id,
                    ScoreRecord.score_type == "competition",
                )
            )
        ).scalar_one()
        active_work_scores = (
            await db.execute(
                select(func.coalesce(func.sum(Work.score), 0)).where(
                    Work.student_id == student.id,
                    Work.is_active == True,
                )
            )
        ).scalar_one()
        assert student.total_score == int(
            root_total + trunk_total + homework_total + competition_total + active_work_scores
        )

    lit_counts = {
        str(student.id): (
            await db.execute(
                select(func.count())
                .select_from(StudentBookScore)
                .where(
                    StudentBookScore.student_id == student.id,
                    StudentBookScore.max_single_score >= 50,
                )
            )
        ).scalar_one()
        for student in demo_students
    }

    assert all(student.classroom_id is not None for student in demo_students)
    assert any(count > 0 for count in lit_counts.values())
    assert any(count == 0 for count in lit_counts.values())


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


async def test_demo_work_images_are_accessible(client, db):
    await seed_demo_data(db)

    works = (
        await db.execute(
            select(Work)
            .where(Work.is_active == True)
            .order_by(Work.created_at.asc())
        )
    ).scalars().all()
    assert works

    for work in works:
        assert work.image_url.startswith("/uploads/demo-")
        response = await client.get(work.image_url)
        assert response.status_code == 200
        assert response.headers.get("content-type", "").startswith("image/")


async def test_demo_cleanup_removes_only_demo_upload_assets_and_seed_restores_them(client, db):
    uploads_dir = Path(UPLOADS_DIR)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    organic_file = uploads_dir / "organic-upload.jpg"
    if organic_file.exists():
        organic_file.unlink()
    organic_file.write_bytes(b"organic")

    try:
        await seed_demo_data(db)
        assert organic_file.exists()

        for filename in DEMO_IMAGE_FILENAMES:
            assert (uploads_dir / filename).exists()

        await clear_demo_data(db)

        for filename in DEMO_IMAGE_FILENAMES:
            demo_path = uploads_dir / filename
            assert not demo_path.exists()
            response = await client.get(f"/uploads/{filename}")
            assert response.status_code == 404

        assert organic_file.exists()

        await seed_demo_data(db)

        for filename in DEMO_IMAGE_FILENAMES:
            demo_path = uploads_dir / filename
            assert demo_path.exists()
            response = await client.get(f"/uploads/{filename}")
            assert response.status_code == 200
    finally:
        if organic_file.exists():
            organic_file.unlink()
