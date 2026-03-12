# 书法成长树 - 管理后台

书法教育校级管理平台，包含 FastAPI 后端 + React 前端，支持多教师协作、班级管理、积分体系、统计分析等完整功能。

## 技术栈

- **后端**: Python 3.10 + FastAPI + PostgreSQL + Redis
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS
- **部署**: Docker Compose + Nginx

---

## 本地开发环境搭建

### 前置要求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装并运行
- [Node.js 20+](https://nodejs.org/) 已安装
- Git 已安装

### 步骤

**1. 克隆代码**

```bash
git clone git@github.com:sunyj89/calligraphy-server.git
cd calligraphy-server
```

**2. 启动后端服务（数据库 + Redis + API）**

```bash
docker-compose up -d
```

> 本地会自动加载 `docker-compose.override.yml`，无需 SSL，nginx 只走 HTTP。

**3. 初始化数据库**

首次启动需要建表并写入初始数据：

```bash
docker-compose exec app python -m scripts.init_db
```

**4. 启动前端开发服务器**

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173，`/api` 请求会自动代理到后端。

### 无 Docker 的本地开发模式

如果当前机器没有启动 Docker，也可以直接使用项目内置的本地开发脚本：

```bash
python scripts/local_dev_server.py
```

这个脚本会自动：
- 使用 `SQLite` 作为本地数据库
- 使用 `FakeRedis` 代替本地 Redis 服务
- 在首次启动时初始化种子数据
- 启动后端 API 到 `http://127.0.0.1:8000`

前端和 H5 可分别启动：

```bash
cd frontend
npm run dev -- --host 127.0.0.1

cd ../H5
npm run dev -- --host 127.0.0.1 --port 4173
```

### 一键运行本地 UAT 回归

```bash
python scripts/run_e2e.py
```

这个脚本会自动启动：
- 本地后端 API
- Web 管理后台
- H5 学生端
- Playwright 端到端测试

如果只想跑某一组 E2E，例如学生端：

```bash
python scripts/run_e2e.py tests/student.spec.ts
```

### 默认账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | 13900000000 | admin123 |
| 教师 | 13800000000 | teacher123 |

### 常用命令

```bash
# 查看后端日志
docker-compose logs -f app

# 重启后端
docker-compose restart app

# 停止所有服务
docker-compose down

# 清空数据库重新初始化（慎用）
docker-compose down -v
docker-compose up -d
docker-compose exec app python -m scripts.init_db
```

---

## 生产环境部署

### 前置要求

- 服务器已安装 Docker 和 Docker Compose
- 域名已解析到服务器 IP
- SSL 证书已准备好（放在 `ssl/fullchain.pem` 和 `ssl/privkey.key`）

> `ssl/` 目录在 `.gitignore` 中，不会提交到 git，需要在服务器上手动放置证书文件。

### 首次部署

```bash
# 1. 克隆代码
git clone git@github.com:sunyj89/calligraphy-server.git
cd calligraphy-server

# 2. 放置 SSL 证书
mkdir -p ssl
cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.key ssl/

# 3. 构建前端
cd frontend && npm install && npm run build && cd ..

# 4. 启动所有服务
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. 初始化数据库（仅首次）
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec app python -m scripts.init_db
```

### 日常更新部署

代码推送到 GitHub 后，在服务器执行：

```bash
cd /home/admin/calligraphy-server
./deploy.sh
```

脚本会自动完成：拉取代码 → 构建前端 → 重启服务。

---

## 项目结构

```
calligraphy-server/
├── app/                        # 后端源码
│   ├── api/endpoints/          # API 路由
│   ├── services/               # 业务逻辑
│   ├── models/                 # 数据库模型
│   ├── schemas/                # 请求/响应结构
│   └── core/                   # 配置、JWT、Redis
├── frontend/                   # 前端源码
│   ├── src/
│   │   ├── sections/           # 页面组件
│   │   ├── components/ui/      # 通用 UI 组件
│   │   ├── lib/api.ts          # API 请求封装
│   │   └── contexts/           # React Context
│   └── dist/                   # 构建产物（gitignore）
├── scripts/
│   └── init_db.py              # 数据库初始化
├── ssl/                        # SSL 证书（gitignore）
├── docker-compose.yml          # 基础配置
├── docker-compose.override.yml # 本地开发覆盖
├── docker-compose.prod.yml     # 生产环境覆盖
├── nginx.conf                  # 生产 nginx（HTTPS）
├── nginx.dev.conf              # 本地 nginx（HTTP）
└── deploy.sh                   # 服务器一键部署脚本
```

---

## API 文档

后端启动后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 积分规则

### 积分类型

| 类型 | 分值 | 说明 |
|------|------|------|
| root（根） | 5 | 练习册 ≤16 册 |
| trunk（干） | 20 | 练习册 >16 册 |
| leaf（叶） | 1–3 | 日常作业，资深学员自动翻倍 |
| fruit（果） | 30–50 | 比赛作品 |
| adjustment | 任意 | 积分调整（支持负数） |

### 成长阶段

| 阶段 | 名称 | 分数范围 |
|------|------|----------|
| sprout | 萌芽宝宝 | 0–1,499 |
| seedling | 努力伸腰 | 1,500–2,999 |
| small | 撑起小伞 | 3,000–4,499 |
| medium | 有模有样 | 4,500–5,999 |
| large | 披上绿袍 | 6,000–7,499 |
| xlarge | 绿意满满 | 7,500–8,999 |
| fruitful | 硕果累累 | 9,000+ |

当 `root_score + trunk_score >= 4500` 时自动标记为资深学员，此状态不可逆。

---

## License

Private
