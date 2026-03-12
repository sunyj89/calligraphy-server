async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "teacher123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_teacher_can_create_student_with_password_and_student_can_login(client):
    teacher_token = await login_teacher(client)

    create_response = await client.post(
        "/api/students",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "name": "新建学员",
            "phone": "13600000001",
            "password": "student123",
            "school": "示范小学",
        },
    )

    assert create_response.status_code == 200
    assert create_response.json()["phone"] == "13600000001"

    login_response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13600000001", "password": "student123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["student"]["phone"] == "13600000001"
