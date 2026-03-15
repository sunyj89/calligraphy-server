from sqlalchemy import select

from app.core.security import hash_password
from app.models import Classroom, ScoreRecord, Student, Teacher, Work


async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def login_admin(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13900000000", "password": "admin123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_teacher_can_create_student_with_password_and_student_can_login(client):
    teacher_token = await login_teacher(client)

    create_response = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "name": "New Student",
            "phone": "13600000001",
            "password": "student123",
            "school": "Sample Primary School",
            "address": "Library Road 8",
            "grade": "2",
            "gender": "male",
            "birthday": "2017-01-01",
        },
    )

    assert create_response.status_code == 200
    assert create_response.json()["phone"] == "13600000001"
    assert create_response.json()["address"] == "Library Road 8"
    assert create_response.json()["birthday"] == "2017-01-01"

    login_response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13600000001", "password": "student123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["student"]["phone"] == "13600000001"


async def test_admin_student_list_supports_teacher_filter(client, db):
    admin_token = await login_admin(client)

    base_teacher = (await db.execute(select(Teacher).where(Teacher.phone == "13800000000"))).scalar_one()
    extra_teacher = Teacher(
        name="Teacher Filter",
        phone="13800000009",
        password_hash=hash_password("123456"),
        role="teacher",
    )
    db.add(extra_teacher)
    await db.flush()

    extra_classroom = Classroom(
        name="Filter Class",
        grade_year="3",
        teacher_id=extra_teacher.id,
        description="filter classroom",
    )
    db.add(extra_classroom)
    await db.flush()

    extra_student = Student(
        name="Filter Student",
        phone="13700000009",
        password_hash=hash_password("111111"),
        grade="3",
        gender="female",
        classroom_id=extra_classroom.id,
        # Intentionally mismatched creator to verify teacher filter semantics:
        # teacher_id filter should follow classroom responsible teacher.
        created_by=base_teacher.id,
    )
    db.add(extra_student)
    await db.commit()

    base_filter_resp = await client.get(
        f"/api/students?teacher_id={base_teacher.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert base_filter_resp.status_code == 200
    base_items = base_filter_resp.json()["items"]
    assert base_items
    assert all(item["phone"] != "13700000009" for item in base_items)

    extra_filter_resp = await client.get(
        f"/api/students?teacher_id={extra_teacher.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert extra_filter_resp.status_code == 200
    extra_items = extra_filter_resp.json()["items"]
    assert len(extra_items) == 1
    assert extra_items[0]["phone"] == "13700000009"


async def test_student_detail_returns_aggregate_payload(client, db):
    teacher_token = await login_teacher(client)
    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()

    score_resp = await client.post(
        f"/api/students/{student.id}/scores",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "score_type": "competition",
            "score": 88,
            "term": "spring",
            "reason": "detail-check",
        },
    )
    assert score_resp.status_code == 200

    work_resp = await client.post(
        f"/api/students/{student.id}/works",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "term": "spring",
            "slot_index": 1,
            "gallery_scope": "classroom",
            "image_url": "/uploads/detail-check.jpg",
            "description": "detail work",
            "score": 90,
        },
    )
    assert work_resp.status_code == 200

    detail_resp = await client.get(
        f"/api/students/{student.id}/detail",
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert detail_resp.status_code == 200
    payload = detail_resp.json()

    assert payload["student"]["id"] == str(student.id)
    assert payload["student"]["total_score"] >= 0
    assert payload["classroom"] is not None
    assert payload["teacher"] is not None
    assert payload["growth_detail"]["total"] >= 1
    assert payload["works"]["total"] >= 1
    assert {"id", "score_type", "score", "created_at"}.issubset(payload["growth_detail"]["items"][0].keys())
    assert {"id", "slot_index", "gallery_scope", "score", "created_at"}.issubset(
        payload["works"]["items"][0].keys()
    )

    growth_count = (
        await db.execute(select(ScoreRecord).where(ScoreRecord.student_id == student.id))
    ).scalars().all()
    work_count = (
        await db.execute(select(Work).where(Work.student_id == student.id, Work.is_active == True))
    ).scalars().all()
    assert payload["growth_detail"]["total"] == len(growth_count)
    assert payload["works"]["total"] == len(work_count)


async def test_student_detail_teacher_is_classroom_responsible_teacher_not_creator(client, db):
    classroom_teacher_token = await login_teacher(client)
    classroom_teacher = (await db.execute(select(Teacher).where(Teacher.phone == "13800000000"))).scalar_one()

    creator_teacher = Teacher(
        name="Teacher Creator",
        phone="13800000019",
        password_hash=hash_password("123456"),
        role="teacher",
    )
    db.add(creator_teacher)
    await db.flush()

    class_for_semantic = Classroom(
        name="Semantic Class",
        grade_year="2",
        teacher_id=classroom_teacher.id,
        description="semantic class",
    )
    db.add(class_for_semantic)
    await db.flush()

    student = Student(
        name="Semantic Student",
        phone="13700000019",
        password_hash=hash_password("111111"),
        grade="2",
        gender="female",
        classroom_id=class_for_semantic.id,
        created_by=creator_teacher.id,
    )
    db.add(student)
    await db.commit()

    detail_resp = await client.get(
        f"/api/students/{student.id}/detail",
        headers={"Authorization": f"Bearer {classroom_teacher_token}"},
    )
    assert detail_resp.status_code == 200
    payload = detail_resp.json()

    assert payload["teacher"]["id"] == str(classroom_teacher.id)
    assert payload["teacher"]["phone"] == "13800000000"
    assert payload["teacher"]["id"] != str(creator_teacher.id)


async def test_teacher_cannot_access_student_outside_own_classroom(client, db):
    owner_teacher = Teacher(
        name="Teacher Owner",
        phone="13800000012",
        password_hash=hash_password("123456"),
        role="teacher",
    )
    db.add(owner_teacher)
    await db.flush()

    owner_classroom = Classroom(
        name="Owner Classroom",
        grade_year="4",
        teacher_id=owner_teacher.id,
        description="owner classroom",
    )
    db.add(owner_classroom)
    await db.flush()

    protected_student = Student(
        name="Protected Student",
        phone="13700000012",
        password_hash=hash_password("111111"),
        grade="4",
        gender="female",
        classroom_id=owner_classroom.id,
        created_by=owner_teacher.id,
    )
    db.add(protected_student)
    await db.commit()

    other_teacher_token = await login_teacher(client)
    detail_forbidden = await client.get(
        f"/api/students/{protected_student.id}/detail",
        headers={"Authorization": f"Bearer {other_teacher_token}"},
    )
    assert detail_forbidden.status_code == 403

    base_forbidden = await client.get(
        f"/api/students/{protected_student.id}",
        headers={"Authorization": f"Bearer {other_teacher_token}"},
    )
    assert base_forbidden.status_code == 403

    owner_login = await client.post(
        "/api/auth/login",
        json={"phone": "13800000012", "password": "123456"},
    )
    assert owner_login.status_code == 200
    owner_token = owner_login.json()["access_token"]

    detail_allowed = await client.get(
        f"/api/students/{protected_student.id}/detail",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert detail_allowed.status_code == 200

    base_allowed = await client.get(
        f"/api/students/{protected_student.id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert base_allowed.status_code == 200

    admin_token = await login_admin(client)
    admin_detail = await client.get(
        f"/api/students/{protected_student.id}/detail",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_detail.status_code == 200
