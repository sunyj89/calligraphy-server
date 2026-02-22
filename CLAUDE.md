# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

书法成长树（Calligraphy Growth Tree）微信小程序后端。FastAPI 0.109 + SQLAlchemy 2.0 (async) + PostgreSQL 15 + Redis 7。Python 3.10+。

## Commands

```bash
# 安装依赖
pip install -e ".[dev]"

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 初始化数据库（创建表 + 种子数据）
python scripts/init_db.py

# 数据库迁移
alembic revision --autogenerate -m "description"
alembic upgrade head

# 测试
pytest
pytest tests/api/test_auth.py -v          # 单个测试文件
pytest -k "test_login" -v                 # 按名称匹配

# 格式化 & lint
ruff check app/ --fix
ruff format app/
```

## Docker

```bash
docker-compose up -d                      # 启动全部服务（pg + redis + app + nginx）
docker-compose up -d db redis             # 仅启动数据库和缓存
```

## Architecture

三层架构：`endpoints → services → models`，通过 Pydantic schemas 做数据校验。

- **app/api/endpoints/** — 路由处理，通过 `app/api/routers.py` 统一注册到 `/api` 前缀
- **app/services/** — 业务逻辑层，每个 service 接收 AsyncSession 参数
- **app/models/** — SQLAlchemy 2.0 async 模型，全部使用 UUID 主键，`app/models/base.py` 定义引擎和 session 工厂
- **app/schemas/** — Pydantic v2 请求/响应模型，`schemas/base.py` 提供统一响应包装 `{"code": 200, "message": "success", "data": ...}`
- **app/core/** — 横切关注点：config（Pydantic Settings）、security（JWT + bcrypt）、redis、exceptions

## Authentication

双认证体系：

1. **教师端**：手机号 + 密码 → JWT（含 jti、sub、iat）
2. **微信小程序**：wx.login code → openid → 自动注册/登录 → JWT

关键机制：
- 登出时 jti 写入 Redis 黑名单（TTL = token 过期时间）
- 修改密码后 `password_changed_at` 更新，所有旧 token 失效（比对 iat）
- 微信 session_key 缓存在 Redis（30 分钟 TTL），用于手机号解密（AES-128-CBC）
- 开发环境 mock 模式：`WECHAT_APPID=mock_appid` 时跳过微信 API 调用

依赖注入链：`OAuth2PasswordBearer → decode JWT → check blacklist → verify password_changed_at → return Teacher`（见 `app/api/dependencies.py`）

## Growth Score System

积分体系是核心业务逻辑，集中在 `app/services/score_service.py`：

- 四种积分类型及权重：root(×1)、trunk(×1)、leaf(×10)、fruit(×100)
- 7 个成长阶段：萌芽宝宝(0-1499) → 努力伸腰(1500) → 撑起小伞(3000) → 有模有样(4500) → 披上绿袍(6000) → 绿意满满(7500) → 硕果累累(9000+)
- 升学条件：root_score + trunk_score ≥ 4500，一旦达到不可逆（`ever_reached_senior` 标记）
- 删除积分时反向扣减，防止负数

## Environment Variables

必需变量见 `.env.example`。关键项：
- `DATABASE_URL` — PostgreSQL 连接串（asyncpg 驱动）
- `REDIS_URL` + `REDIS_PASSWORD` — Redis 连接
- `SECRET_KEY` — JWT 签名密钥
- `WECHAT_APPID` / `WECHAT_SECRET` — 微信小程序凭证（设为 `mock_appid` 启用 mock 模式）
- `CORS_ORIGINS` — JSON 数组格式的允许源

## Code Style

- Ruff：line-length 100，target py310
- 类型注解：所有函数签名必须有类型提示
- 命名：snake_case（函数/变量），CamelCase（类），UPPER_SNAKE_CASE（常量）
- 软删除模式：通过 `is_active` 布尔字段，不做物理删除

## Default Dev Credentials

- Admin: 13900000000 / admin123
- Teacher: 13800000000 / teacher123
