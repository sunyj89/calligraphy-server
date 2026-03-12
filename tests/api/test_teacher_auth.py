async def login_teacher(client):
    response = await client.post(
        "/api/auth/login",
        json={"phone": "13800000000", "password": "123456"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


async def test_teacher_logout_blacklists_token(client):
    token = await login_teacher(client)

    me_response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200

    logout_response = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_response.status_code == 200

    me_after_logout = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_after_logout.status_code == 401
