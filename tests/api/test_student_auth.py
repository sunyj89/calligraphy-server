async def login_student(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "test123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_student_login_with_password(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "test123456"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["phone"] == "13700000000"
    assert payload["access_token"]


async def test_student_login_rejects_wrong_password(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "wrongpassword"},
    )

    assert response.status_code == 401


async def test_get_student_profile(client):
    token = await login_student(client)

    response = await client.get(
        "/api/student/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["phone"] == "13700000000"
    assert payload["total_score"] == 4587


async def test_update_student_profile(client):
    token = await login_student(client)

    response = await client.put(
        "/api/student/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "新名字"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "新名字"


async def test_change_student_password(client):
    token = await login_student(client)

    response = await client.put(
        "/api/student/password",
        headers={"Authorization": f"Bearer {token}"},
        json={"old_password": "test123456", "new_password": "newpass123"},
    )

    assert response.status_code == 200

    login_response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "newpass123"},
    )
    assert login_response.status_code == 200


async def test_student_logout_blacklists_token(client):
    token = await login_student(client)

    me_response = await client.get(
        "/api/student/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200

    logout_response = await client.post(
        "/api/auth/student/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_response.status_code == 200

    me_after_logout = await client.get(
        "/api/student/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_after_logout.status_code == 401


async def test_student_sms_routes_are_removed(client):
    response = await client.post(
        "/api/auth/student/sms-code",
        json={"phone": "13912345678"},
    )

    assert response.status_code == 404

    response = await client.post(
        "/api/auth/student/sms-login",
        json={"phone": "13912345678", "code": "888888"},
    )

    assert response.status_code == 404


async def test_student_register_route_is_removed(client):
    response = await client.post(
        "/api/auth/student/register",
        json={
            "phone": "13912345678",
            "code": "888888",
            "password": "test123456",
            "name": "新用户",
        },
    )

    assert response.status_code == 404


async def test_wechat_routes_are_removed(client):
    response = await client.post("/api/auth/wechat/login", json={"code": "mock-code"})
    assert response.status_code == 404
