# 书法成长树后端

书法教育管理系统后端 API

## 技术栈

- FastAPI
- PostgreSQL 15 (asyncpg)
- Redis 7
- SQLAlchemy (异步)
- Alembic (数据库迁移)
- Docker

## 快速启动

### 开发环境

```bash
# 1. 安装依赖
poetry install

# 2. 启动数据库和 Redis
docker-compose up -d db redis

# 3. 初始化数据库（首次）
poetry run python scripts/init_db.py

# 4. 启动服务
poetry run uvicorn app.main:app --reload
```

服务运行在 http://localhost:8000

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

## 默认账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13900000000 | admin123 |
| 教师 | 13800000000 | teacher123 |

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
python_server/
├── app/
│   ├── api/          # API 端点
│   ├── core/         # 核心配置
│   ├── models/       # 数据库模型
│   ├── schemas/      # Pydantic Schema
│   └── services/     # 业务逻辑
├── alembic/          # 数据库迁移
├── scripts/          # 脚本
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml
```

## 积分规则

| 类型 | 分数 | 权重 |
|------|------|------|
| root (根) | 1 | ×1 |
| trunk (茎) | 1 | ×1 |
| leaf (叶) | 1 | ×10 |
| fruit (果) | 1 | ×100 |

## 成长阶段

| 阶段 | 分数范围 |
|------|----------|
| 萌芽宝宝 | 0-1499 |
| 努力伸腰 | 1500-2999 |
| 撑起小伞 | 3000-4499 |
| 有模有样 | 4500-5999 |
| 披上绿袍 | 6000-7499 |
| 绿意满满 | 7500-8999 |
| 硕果累累 | 9000+ |
