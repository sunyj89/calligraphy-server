async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
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
