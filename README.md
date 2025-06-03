# RAG Chat 应用 Docker 部署指南

## 快速开始

### 1. 克隆项目
\`\`\`bash
git clone <repository-url>
cd rag-chat-app
\`\`\`

### 2. 配置环境变量
\`\`\`bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
\`\`\`

### 3. 启动应用
\`\`\`bash
# 生产环境
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 或者手动启动
docker-compose up -d
\`\`\`

### 4. 访问应用
- 应用地址: http://localhost:3000
- 数据库: localhost:5432
- Redis: localhost:6379

## 开发环境

### 启动开发环境
\`\`\`bash
chmod +x scripts/dev.sh
./scripts/dev.sh

# 或者手动启动
docker-compose -f docker-compose.dev.yml up -d
\`\`\`

### 开发环境地址
- 应用地址: http://localhost:3001
- 数据库: localhost:5433
- Redis: localhost:6380

## 服务管理

### 查看服务状态
\`\`\`bash
docker-compose ps
\`\`\`

### 查看日志
\`\`\`bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs app
docker-compose logs postgres
\`\`\`

### 停止服务
\`\`\`bash
docker-compose down
\`\`\`

### 重启服务
\`\`\`bash
docker-compose restart
\`\`\`

## 数据管理

### 备份数据
\`\`\`bash
chmod +x scripts/backup.sh
./scripts/backup.sh
\`\`\`

### 恢复数据
\`\`\`bash
# 从备份文件恢复
gunzip backups/rag_chat_backup_YYYYMMDD_HHMMSS.sql.gz
docker-compose exec -T postgres psql -U postgres rag_chat < backups/rag_chat_backup_YYYYMMDD_HHMMSS.sql
\`\`\`

### 数据库迁移
\`\`\`bash
docker-compose exec app npx drizzle-kit push:pg
\`\`\`

## 监控

### 启动监控服务
\`\`\`bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
\`\`\`

### 访问监控界面
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 故障排除

### 常见问题

1. **端口冲突**
   - 修改 .env 文件中的端口配置
   - 或停止占用端口的其他服务

2. **数据库连接失败**
   - 检查 PostgreSQL 容器是否正常运行
   - 验证数据库连接字符串

3. **应用无法启动**
   - 检查环境变量配置
   - 查看应用日志: `docker-compose logs app`

4. **文件上传失败**
   - 检查上传目录权限
   - 确认文件大小限制

### 重置环境
\`\`\`bash
# 停止所有服务
docker-compose down

# 删除所有数据卷（注意：这会删除所有数据）
docker-compose down -v

# 重新启动
docker-compose up -d
\`\`\`

## 生产环境建议

1. **安全配置**
   - 修改默认密码
   - 配置防火墙规则
   - 使用HTTPS

2. **性能优化**
   - 配置适当的资源限制
   - 启用日志轮转
   - 配置缓存策略

3. **备份策略**
   - 定期自动备份
   - 异地备份存储
   - 测试恢复流程

4. **监控告警**
   - 配置健康检查
   - 设置监控告警
   - 日志聚合分析
