import pytest

from app.core import redis as redis_module


@pytest.mark.asyncio
async def test_get_redis_uses_fakeredis_when_enabled(monkeypatch):
    monkeypatch.setattr(redis_module.settings, "USE_FAKE_REDIS", True, raising=False)
    redis_module._redis_client = None

    client = await redis_module.get_redis()
    await client.set("healthcheck", "ok")

    assert await client.get("healthcheck") == "ok"

    await redis_module.close_redis()
