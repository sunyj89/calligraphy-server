from sqlalchemy import select

from app.models import AuditLog, Student, Teacher


async def test_student_password_login_smoke(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "111111"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["phone"] == "13700000000"
    assert payload["access_token"]


async def test_teacher_login_writes_login_audit_log(client, db):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
        headers={"x-forwarded-for": "10.0.0.8"},
    )
    assert response.status_code == 200

    teacher = (await db.execute(select(Teacher).where(Teacher.phone == "13800000000"))).scalar_one()
    latest_log = (
        await db.execute(
            select(AuditLog)
            .where(AuditLog.action == "login_success", AuditLog.platform == "teacher")
            .order_by(AuditLog.created_at.desc())
        )
    ).scalars().first()

    assert latest_log is not None
    assert str(latest_log.teacher_id) == str(teacher.id)
    assert latest_log.account == "13800000000"
    assert latest_log.platform == "teacher"
    assert latest_log.ip_address == "10.0.0.8"


async def test_student_login_writes_login_audit_log(client, db):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "111111"},
        headers={"x-forwarded-for": "10.0.0.9"},
    )
    assert response.status_code == 200

    student = (await db.execute(select(Student).where(Student.phone == "13700000000"))).scalar_one()
    latest_log = (
        await db.execute(
            select(AuditLog)
            .where(AuditLog.action == "login_success", AuditLog.platform == "student")
            .order_by(AuditLog.created_at.desc())
        )
    ).scalars().first()

    assert latest_log is not None
    assert latest_log.teacher_id is None
    assert latest_log.target_id == str(student.id)
    assert latest_log.account == "13700000000"
    assert latest_log.platform == "student"
    assert latest_log.ip_address == "10.0.0.9"
