import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


class TestStudentAuth:
    """学生认证 API 测试 - 使用真实数据库"""

    @pytest.fixture
    async def client(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    async def test_send_sms_code(self, client: AsyncClient):
        """测试发送验证码"""
        response = await client.post("/api/auth/student/sms-code", json={
            "phone": "13912345678"
        })
        assert response.status_code == 200
        data = response.json()
        assert "888888" in data["message"] or "发送" in data["message"]

    async def test_student_login(self, client: AsyncClient):
        """测试账号密码登录"""
        response = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "test123456"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["student"]["phone"] == "13700000000"

    async def test_student_login_wrong_password(self, client: AsyncClient):
        """测试错误密码登录"""
        response = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    async def test_get_student_profile(self, client: AsyncClient):
        """测试获取学生信息"""
        login_response = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "test123456"
        })
        token = login_response.json()["access_token"]
        
        response = await client.get(
            "/api/student/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "13700000000"
        assert data["totalScore"] == 4587

    async def test_update_student_profile(self, client: AsyncClient):
        """测试修改学生信息"""
        login_response = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "test123456"
        })
        token = login_response.json()["access_token"]
        
        response = await client.put(
            "/api/student/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "新名字"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "新名字"

    async def test_change_password(self, client: AsyncClient):
        """测试修改密码"""
        login_response = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "test123456"
        })
        token = login_response.json()["access_token"]
        
        response = await client.put(
            "/api/student/password",
            headers={"Authorization": f"Bearer {token}"},
            json={"old_password": "test123456", "new_password": "newpass123"}
        )
        assert response.status_code == 200
        
        login_response2 = await client.post("/api/auth/student/login", json={
            "phone": "13700000000",
            "password": "newpass123"
        })
        assert login_response2.status_code == 200
        
        await client.put(
            "/api/student/password",
            headers={"Authorization": f"Bearer {login_response2.json()['access_token']}"},
            json={"old_password": "newpass123", "new_password": "test123456"}
        )
