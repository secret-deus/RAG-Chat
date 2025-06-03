#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署 RAG Chat 应用..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ 未找到 .env 文件，请先复制 .env.example 并配置环境变量"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose pull

# 构建应用镜像
echo "🔨 构建应用镜像..."
docker-compose build --no-cache app

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker-compose exec app npx drizzle-kit push:pg

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ 部署成功！应用正在运行在 http://localhost:3000"
else
    echo "❌ 健康检查失败，请检查日志"
    docker-compose logs app
    exit 1
fi

echo "🎉 部署完成！"
