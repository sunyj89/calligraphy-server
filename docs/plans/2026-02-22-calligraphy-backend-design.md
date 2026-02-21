# 书法成长树小程序 - 后端设计文档

## 项目概述

书法成长树是一个书法教育管理系统，采用"成长树"比喻可视化学生书法学习进度。系统包含教师端（管理学员、记录积分）和学生端（微信小程序）。

## 技术栈

- 框架: FastAPI (Python 3.10+)
- 数据库: PostgreSQL 15+ (asyncpg 异步驱动)
- 缓存: Redis 7 (JWT 黑名单、微信 session_key)
- HTTP客户端: httpx (异步)
- 依赖管理: Poetry
- 部署: Docker

## 架构设计

### 目录结构

```
python_server/
├── app/
│   ├── main.py                    # FastAPI 实例 + CORS
│   ├── api/
│   │   ├── dependencies.py        # 依赖注入（用户认证、会话）
│   │   ├── routers.py             # 路由聚合
│   │   └── endpoints/
│   │       ├── auth.py            # 教师认证
│   │       ├── wechat_auth.py     # 微信小程序认证
│   │       ├── students.py        # 学员管理
│   │       ├── scores.py          # 积分管理
│   │       ├── books.py           # 练习册
│   │       ├── works.py           # 作品上传
│   │       └── statistics.py     # 统计数据
│   ├── core/
│   │   ├── config.py              # Pydantic Settings 配置
│   │   ├── security.py           # JWT + bcrypt + 黑名单
│   │   ├── exceptions.py          # 自定义异常
│   │   └── redis.py               # Redis 连接池
│   ├── models/                    # SQLAlchemy 模型
│   ├── schemas/                   # Pydantic Schema
│   ├── services/                  # 业务逻辑
│   └── utils/                     # 工具函数
├── tests/                         # 测试
├── alembic/                       # 数据库迁移
├── docker-compose.yml            # Docker 编排
└── pyproject.toml                 # Poetry 配置
```

### 核心安全机制

1. **JWT Token**: 使用 PyJWT 生成，包含 jti(唯一标识)、sub(用户ID)、iat(签发时间)
2. **Token 黑名单**: 退出登录时 jti 加入 Redis
3. **改密拦截**: 验证 token_iat < password_changed_at，使旧 Token 失效
4. **微信 session_key**: 登录时存入 Redis（30分钟TTL）

### 成长阶段算法

| 阶段 | 分数范围 | 名称 |
|------|----------|------|
| sprout | 0-1499 | 萌芽宝宝 |
| seedling | 1500-2999 | 努力伸腰 |
| small | 3000-4499 | 撑起小伞 |
| medium | 4500-5999 | 有模有样 |
| large | 6000-7499 | 披上绿袍 |
| xlarge | 7500-8999 | 绿意满满 |
| fruitful | 9000+ | 硕果累累 |

### 资深学员规则

- 根+茎分数 >= 4500 时成为资深学员
- 一旦成为资深学员，状态不可逆（ever_reached_senior = True）

## API 设计

### 认证模块

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 教师账号密码登录 |
| /api/auth/me | GET | 获取当前教师信息 |
| /api/auth/logout | POST | 退出登录（加入黑名单） |
| /api/auth/password | PUT | 修改密码 |
| /api/auth/wechat/login | POST | 微信小程序登录 |
| /api/auth/wechat/phone | POST | 解密手机号 |

### 学员管理

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/students | GET | 学员列表（分页搜索） |
| /api/students | POST | 创建学员 |
| /api/students/{id} | GET | 学员详情 |
| /api/students/{id} | PUT | 更新学员 |
| /api/students/{id} | DELETE | 软删除学员 |
| /api/students/statistics | GET | 统计卡片数据 |

### 积分系统

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/students/{id}/scores | GET | 积分记录 |
| /api/students/{id}/scores | POST | 添加积分（悲观锁） |
| /api/scores/{id} | DELETE | 撤销积分 |

## 开发环境

- PostgreSQL + Redis 通过 docker-compose 启动
- 微信模块使用 Mock 模式（无需真实 AppID）
- CORS 配置允许前端开发服务器访问

## 文档版本

- v1.0: 2026-02-22
