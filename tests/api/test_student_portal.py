from sqlalchemy import select

from app.models import Book, Student


async def login_student(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "111111"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_student_can_view_and_update_profile(client):
    token = await login_student(client)
    me = await client.get("/api/student/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["phone"] == "13700000000"

    update = await client.put(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "New Name", "school": "Calligraphy School"},
    )
    assert update.status_code == 200
    assert update.json()["name"] == "New Name"


async def test_student_change_password_flow(client):
    token = await login_student(client)
    changed = await client.put(
        "/api/student/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"old_password": "111111", "new_password": "11111199"},
    )
    assert changed.status_code == 200

    new_login = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "11111199"},
    )
    assert new_login.status_code == 200


async def test_student_can_list_scores_and_works(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    book = (await db.execute(select(Book).order_by(Book.order_num.asc()))).scalars().first()

    add_practice = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "practice",
            "score": 50,
            "term": "spring",
            "target_part": "root",
            "book_id": str(book.id),
            "reason": "lesson",
        },
    )
    assert add_practice.status_code == 200

    add_work = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 1,
            "gallery_scope": "classroom",
            "image_url": "/uploads/demo.jpg",
            "description": "demo",
            "score": 88,
        },
    )
    assert add_work.status_code == 200

    student_token = await login_student(client)
    scores_resp = await client.get(
        "/api/student/scores?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert scores_resp.status_code == 200
    assert scores_resp.json()["total"] >= 1

    works_resp = await client.get(
        "/api/student/works?term=spring",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert works_resp.status_code == 200
    assert works_resp.json()["total"] >= 1
