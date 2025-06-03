#!/bin/bash

# 数据备份脚本
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="rag_chat_backup_${TIMESTAMP}.sql"

echo "📦 开始备份数据库..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份PostgreSQL数据库
docker-compose exec -T postgres pg_dump -U postgres rag_chat > "${BACKUP_DIR}/${BACKUP_FILE}"

# 压缩备份文件
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "✅ 备份完成: ${BACKUP_DIR}/${BACKUP_FILE}.gz"

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "🧹 清理完成，已删除7天前的备份文件"
