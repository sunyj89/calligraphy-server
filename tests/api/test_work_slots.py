from sqlalchemy import select

from app.models import Student


async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_work_slot_replacement_overwrites_score(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()

    create_first = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 1,
            "gallery_scope": "classroom",
            "image_url": "/uploads/a.jpg",
            "description": "first",
            "score": 60,
        },
    )
    assert create_first.status_code == 200

    replace = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 1,
            "gallery_scope": "school",
            "image_url": "/uploads/b.jpg",
            "description": "second",
            "score": 90,
        },
    )
    assert replace.status_code == 200

    list_resp = await client.get(
        f"/api/students/{student.id}/works?term=spring",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert list_resp.status_code == 200
    payload = list_resp.json()
    assert payload["total"] == 1
    assert payload["items"][0]["score"] == 90
