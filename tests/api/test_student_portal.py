from sqlalchemy import select

from app.models import Book, ScoreRecord, Student, Teacher, Work


async def login_student(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "test123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def seed_student_activity(db):
    student = (
        await db.execute(select(Student).where(Student.phone == "13700000000"))
    ).scalar_one()
    teacher = (
        await db.execute(select(Teacher).where(Teacher.phone == "13800000000"))
    ).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    score = ScoreRecord(
        student_id=student.id,
        teacher_id=teacher.id,
        score_type="root",
        score=5,
        reason="课堂练习",
    )
    work = Work(
        student_id=student.id,
        book_id=book.id,
        image_url="/uploads/work-1.jpg",
        thumbnail_url="/uploads/work-1-thumb.jpg",
        description="第一幅作品",
    )
    db.add_all([score, work])
    await db.commit()
    await db.refresh(work)
    return {"book": book, "work": work}


async def test_student_can_list_own_scores(client, db):
    token = await login_student(client)
    await seed_student_activity(db)

    response = await client.get(
        "/api/student/scores?page=1&page_size=20",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["score_type"] == "root"


async def test_student_can_list_own_works(client, db):
    token = await login_student(client)
    seeded = await seed_student_activity(db)

    response = await client.get(
        f"/api/student/works?book_id={seeded['book'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["description"] == "第一幅作品"


async def test_student_can_view_own_work_detail(client, db):
    token = await login_student(client)
    seeded = await seed_student_activity(db)

    response = await client.get(
        f"/api/student/works/{seeded['work'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(seeded["work"].id)
    assert payload["book_id"] == str(seeded["book"].id)
