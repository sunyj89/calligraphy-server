#!/bin/bash
set -e

echo "==> 拉取最新代码"
git pull origin master

echo "==> 构建前端"
cd frontend
npm install --silent
npm run build
cd ..

echo "==> 重建并启动服务"
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate nginx

echo "==> 部署完成"
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
