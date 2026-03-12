from sqlalchemy import select

from app.models import Book, Student


async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_homework_multiplier_uses_total_score(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    student.total_score = 5201
    await db.commit()

    response = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "homework",
            "score": 10,
            "term": "spring",
            "reason": "hw",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["multiplier"] == 5
    assert data["score"] == 50


async def test_practice_requires_valid_grade_limit(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    books = []
    for idx in range(1, 8):
        book = Book(name=f"B{idx}", order_num=20 + idx, description="d")
        db.add(book)
        books.append(book)
    await db.commit()
    for book in books:
        await db.refresh(book)

    for idx in range(6):
        ok = await client.post(
            f"/api/students/{student.id}/scores",
            headers={"Authorization": f"Bearer {teacher_token}"},
            json={
                "score_type": "practice",
                "score": 20,
                "term": "spring",
                "target_part": "root",
                "book_id": str(books[idx].id),
            },
        )
        assert ok.status_code == 200

    blocked = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 20,
            "term": "spring",
            "target_part": "root",
            "book_id": str(books[6].id),
        },
    )
    assert blocked.status_code == 400
