async def test_student_password_login_smoke(client):
    response = await client.post(
        "/api/auth/student/login",
        json={"phone": "13700000000", "password": "111111"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["student"]["phone"] == "13700000000"
    assert payload["access_token"]
