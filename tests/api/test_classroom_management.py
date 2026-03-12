from sqlalchemy import select

from app.models import Classroom, Student, Teacher


async def login_admin(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13900000000", "password": "admin123"},
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


async def test_admin_can_create_and_reassign_classroom_teacher(client, db):
    admin_token = await login_admin(client)

    create_teacher = await client.post(
        "/api/teachers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Teacher Li",
            "phone": "13800000001",
            "password": "123456",
            "role": "teacher",
        },
    )
    assert create_teacher.status_code == 200
    teacher_li = create_teacher.json()

    create_classroom = await client.post(
        "/api/classrooms",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Spring Demo Class",
            "grade_year": "2",
            "description": "demo class",
            "teacher_id": teacher_li["id"],
        },
    )
    assert create_classroom.status_code == 200
    created = create_classroom.json()
    assert created["teacher_id"] == teacher_li["id"]
    assert created["teacher"]["name"] == "Teacher Li"

    existing_teacher = (
        await db.execute(select(Teacher).where(Teacher.phone == "13800000000"))
    ).scalar_one()

    reassign = await client.put(
        f"/api/classrooms/{created['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"teacher_id": str(existing_teacher.id)},
    )
    assert reassign.status_code == 200
    updated = reassign.json()
    assert updated["teacher_id"] == str(existing_teacher.id)
    assert updated["teacher"]["phone"] == "13800000000"

    classrooms = await client.get(
        "/api/classrooms",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert classrooms.status_code == 200
    matched = next(item for item in classrooms.json()["items"] if item["id"] == created["id"])
    assert matched["teacher"]["name"] == "Teacher Zhang"


async def test_teacher_can_assign_and_remove_students_from_classroom(client, db):
    teacher_token = await login_teacher(client)

    classroom = (await db.execute(select(Classroom).where(Classroom.name == "Class 1"))).scalar_one()
    classroom_id = classroom.id
    new_student = Student(
        name="Unassigned Student",
        phone="13700000001",
        password_hash="hash",
        grade="1",
        gender="female",
        created_by=classroom.teacher_id,
    )
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    new_student_id = new_student.id

    assign = await client.post(
        f"/api/classrooms/{classroom_id}/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={"student_ids": [str(new_student_id)]},
    )
    assert assign.status_code == 200

    db.expire_all()
    student_detail = (
        await db.execute(select(Student).where(Student.id == new_student_id))
    ).scalar_one()
    assert str(student_detail.classroom_id) == str(classroom_id)

    listing = await client.get(
        f"/api/classrooms/{classroom_id}/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert listing.status_code == 200
    assert any(item["id"] == str(new_student_id) for item in listing.json()["items"])

    removed = await client.post(
        f"/api/classrooms/{classroom_id}/students/remove",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={"student_ids": [str(new_student_id)]},
    )
    assert removed.status_code == 200

    db.expire_all()
    refreshed = (
        await db.execute(select(Student).where(Student.id == new_student_id))
    ).scalar_one()
    assert refreshed.classroom_id is None
