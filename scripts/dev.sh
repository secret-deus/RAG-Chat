#!/bin/bash

# 开发环境启动脚本
set -e

echo "🚀 启动开发环境..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建开发环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件并配置必要的环境变量"
fi

# 启动开发环境
echo "🔧 启动开发环境服务..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ 等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
docker-compose -f docker-compose.dev.yml exec app-dev npx drizzle-kit push:pg

echo "✅ 开发环境启动完成！"
echo "📱 应用地址: http://localhost:3001"
echo "🗄️ 数据库地址: localhost:5433"
echo "🔴 Redis地址: localhost:6380"
