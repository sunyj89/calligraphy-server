# 书法成长树 - 后端 API

书法教育校级管理平台后端服务，支持多教师协作、班级管理、积分体系、统计分析等完整功能。

## 技术栈

- **Python 3.11** + **FastAPI 0.109**
- **PostgreSQL 16** (asyncpg 异步驱动)
- **Redis 7** (token 黑名单 + session 缓存)
- **SQLAlchemy 2.0** (异步 ORM)
- **Docker Compose** (一键部署)

## 功能模块

| 模块 | 说明 |
|------|------|
| 认证系统 | 手机号+密码登录、微信小程序登录、JWT 认证、Redis token 黑名单 |
| 教师管理 | CRUD、角色分配（admin/teacher）、重置密码 |
| 班级管理 | CRUD、学生分配/移除 |
| 学员管理 | CRUD、按班级筛选、权限隔离（教师只看自己的学员） |
| 积分系统 | 基础练习/日常作业/比赛作品/积分调整，自动计算成长阶段 |
| 练习册管理 | CRUD、排序管理 |
| 学生作品 | 上传、展示、删除 |
| 排行榜 | 积分排名，支持按班级筛选 |
| 统计仪表盘 | 总览数据、成长阶段分布、30天积分趋势 |
| 操作日志 | 关键操作记录（admin 可查） |
| 个人中心 | 修改密码、修改姓名 |

## 快速启动

### 开发环境

```bash
# 1. 启动数据库和 Redis
docker-compose up -d db redis

# 2. 安装依赖
pip install -e ".[dev]"

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL、REDIS_URL 等

# 4. 初始化数据库
python -m scripts.init_db

# 5. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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

### API 端点概览

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/password` | PUT | 修改密码 |
| `/api/auth/profile` | PUT | 修改个人信息 |
| `/api/teachers` | GET/POST | 教师列表/创建 |
| `/api/teachers/{id}` | PUT/DELETE | 编辑/禁用教师 |
| `/api/classrooms` | GET/POST | 班级列表/创建 |
| `/api/classrooms/{id}/students` | GET/POST | 班级学生/分配学生 |
| `/api/students` | GET/POST | 学员列表/创建 |
| `/api/students/statistics/overview` | GET | 统计概览 |
| `/api/students/leaderboard` | GET | 排行榜 |
| `/api/students/{id}/scores` | GET/POST | 积分记录 |
| `/api/students/{id}/works` | GET/POST | 学生作品 |
| `/api/books` | GET/POST | 练习册列表/创建 |
| `/api/audit-logs` | GET | 操作日志 |

## 项目结构

```
python_server/
├── app/
│   ├── api/
│   │   ├── endpoints/       # API 端点
│   │   │   ├── auth.py      # 认证
│   │   │   ├── teachers.py  # 教师管理
│   │   │   ├── classrooms.py # 班级管理
│   │   │   ├── students.py  # 学员管理
│   │   │   ├── scores.py    # 积分记录
│   │   │   ├── books.py     # 练习册
│   │   │   ├── works.py     # 学生作品
│   │   │   ├── audit_logs.py # 操作日志
│   │   │   └── upload.py    # 文件上传
│   │   ├── dependencies.py  # 认证依赖注入
│   │   └── routers.py       # 路由注册
│   ├── core/                # 核心配置
│   │   ├── config.py        # 环境变量配置
│   │   ├── security.py      # JWT + bcrypt
│   │   ├── redis.py         # Redis 连接
│   │   └── exceptions.py    # 自定义异常
│   ├── models/              # 数据库模型
│   │   ├── user.py          # Teacher
│   │   ├── student.py       # Student
│   │   ├── classroom.py     # Classroom
│   │   ├── book.py          # Book
│   │   ├── score_record.py  # ScoreRecord
│   │   ├── work.py          # Work
│   │   └── audit_log.py     # AuditLog
│   ├── schemas/             # Pydantic Schema
│   └── services/            # 业务逻辑
├── scripts/
│   └── init_db.py           # 数据库初始化
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml
```

## 积分规则

### 积分类型

| 前端类型 | 后端映射 | 分值 | 说明 |
|----------|---------|------|------|
| basic | root/trunk | 5/20/50 | 练习册 ≤16册为root，>16册为trunk |
| homework | leaf | 1-3 | 资深学员自动翻倍 |
| competition | fruit | 30-50 | 比赛作品 |
| adjustment | - | 任意 | 积分调整（支持负数） |

### 成长阶段

| 阶段 | 名称 | 分数范围 |
|------|------|----------|
| sprout | 萌芽宝宝 | 0 - 1,499 |
| seedling | 努力伸腰 | 1,500 - 2,999 |
| small | 撑起小伞 | 3,000 - 4,499 |
| medium | 有模有样 | 4,500 - 5,999 |
| large | 披上绿袍 | 6,000 - 7,499 |
| xlarge | 绿意满满 | 7,500 - 8,999 |
| fruitful | 硕果累累 | 9,000+ |

### 资深学员

当 `root_score + trunk_score >= 4500` 时自动标记为资深学员，此状态不可逆。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql+asyncpg://user:pass@localhost/db` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `REDIS_PASSWORD` | Redis 密码 | - |
| `SECRET_KEY` | JWT 签名密钥 | 随机字符串 |
| `WECHAT_APPID` | 微信 AppID | `mock_appid`(开发模式) |
| `WECHAT_SECRET` | 微信 Secret | `mock_secret`(开发模式) |
| `CORS_ORIGINS` | 允许的跨域源 | `["http://localhost:5173"]` |

## License

Private
