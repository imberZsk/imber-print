# 3D模型生成Web应用部署和运维手册

## 1. 部署架构

### 1.1 生产环境架构

```mermaid
graph TB
    subgraph "用户层"
        A[用户浏览器]
    end
    
    subgraph "CDN层"
        B[CloudFlare CDN]
    end
    
    subgraph "负载均衡层"
        C[Nginx Load Balancer]
    end
    
    subgraph "应用层"
        D1[Next.js Frontend 1]
        D2[Next.js Frontend 2]
        E1[Express Backend 1]
        E2[Express Backend 2]
    end
    
    subgraph "数据层"
        F[PostgreSQL Primary]
        G[PostgreSQL Replica]
        H[Redis Cluster]
    end
    
    subgraph "存储层"
        I[AWS S3]
        J[CloudFront]
    end
    
    subgraph "AI服务层"
        K[混元AI API]
    end
    
    A --> B
    B --> C
    C --> D1
    C --> D2
    D1 --> E1
    D2 --> E2
    E1 --> F
    E2 --> F
    E1 --> H
    E2 --> H
    E1 --> I
    E2 --> I
    E1 --> K
    E2 --> K
    F --> G
```

### 1.2 服务组件

| 组件         | 版本    | 端口     | 描述         |
| ---------- | ----- | ------ | ---------- |
| Nginx      | 1.25+ | 80/443 | 负载均衡器和反向代理 |
| Next.js    | 15+   | 3000   | 前端应用服务     |
| Express    | 4.18+ | 3001   | 后端API服务    |
| PostgreSQL | 15+   | 5432   | 主数据库       |
| Redis      | 7+    | 6379   | 缓存和会话存储    |
| PM2        | 5+    | -      | 进程管理器      |
| Docker     | 24+   | -      | 容器化平台      |

## 2. 环境配置

### 2.1 开发环境

#### 前端开发配置

```bash
# 安装依赖
npm install -g pnpm
pnpm install

# 环境变量
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_CDN_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 启动开发服务器
pnpm dev
```

#### 后端开发配置

```bash
# 安装依赖
pnpm install

# 环境变量
# .env.development
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/3dgenerator_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
HUNYUAN_API_KEY=your-hunyuan-api-key
HUNYUAN_API_URL=https://api.hunyuan.com

# 启动开发服务器
pnpm dev
```

### 2.2 生产环境配置

#### 系统要求

```bash
# 操作系统
Ubuntu 22.04 LTS 或 CentOS 8+

# 系统依赖
sudo apt update
sudo apt install -y curl wget git nginx postgresql redis-server

# Node.js 安装
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 安装
npm install -g pm2

# Docker 安装
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### 环境变量配置

```bash
# 前端环境变量
# /var/www/3dgenerator-frontend/.env.production
NEXT_PUBLIC_API_URL=https://api.3dgenerator.com
NEXT_PUBLIC_WS_URL=wss://api.3dgenerator.com
NEXT_PUBLIC_CDN_URL=https://cdn.3dgenerator.com
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://3dgenerator.com

# 后端环境变量
# /var/www/3dgenerator-backend/.env.production
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_password@localhost:5432/3dgenerator_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-production-jwt-secret
HUNYUAN_API_KEY=your-production-hunyuan-api-key
HUNYUAN_API_URL=https://api.hunyuan.com

# AWS S3 配置
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=3dgenerator-models

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
```

## 3. 部署流程

### 3.1 数据库部署

#### PostgreSQL 配置

```bash
# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE 3dgenerator_prod;
CREATE USER prod_user WITH PASSWORD 'prod_password';
GRANT ALL PRIVILEGES ON DATABASE 3dgenerator_prod TO prod_user;
\q

# 配置远程访问
sudo nano /etc/postgresql/15/main/postgresql.conf
# 修改: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# 添加: host all all 0.0.0.0/0 md5

# 重启服务
sudo systemctl restart postgresql
```

#### Redis 配置

```bash
# 配置 Redis
sudo nano /etc/redis/redis.conf
# 修改: bind 127.0.0.1 ::1
# 修改: requirepass your_redis_password
# 修改: maxmemory 256mb
# 修改: maxmemory-policy allkeys-lru

# 重启 Redis
sudo systemctl restart redis-server
```

### 3.2 前端部署

#### 构建和部署

```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-org/3dgenerator-frontend.git
cd 3dgenerator-frontend

# 安装依赖
pnpm install

# 构建生产版本
pnpm build

# 配置 PM2
echo "module.exports = {
  apps: [{
    name: '3dgenerator-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}" > ecosystem.config.js

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx 配置

```nginx
# /etc/nginx/sites-available/3dgenerator-frontend
server {
    listen 80;
    server_name 3dgenerator.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 3dgenerator.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/3dgenerator.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/3dgenerator.com/privkey.pem;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 前端代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
}
```

### 3.3 后端部署

#### 应用部署

```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-org/3dgenerator-backend.git
cd 3dgenerator-backend

# 安装依赖
pnpm install

# 数据库迁移
pnpm migrate:prod

# 配置 PM2
echo "module.exports = {
  apps: [{
    name: '3dgenerator-backend',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}" > ecosystem.config.js

# 启动应用
pm2 start ecosystem.config.js
pm2 save
```

#### Nginx API 配置

```nginx
# /etc/nginx/sites-available/3dgenerator-api
upstream backend {
    server localhost:3001;
    server localhost:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name api.3dgenerator.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.3dgenerator.com;
    
    ssl_certificate /etc/letsencrypt/live/api.3dgenerator.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.3dgenerator.com/privkey.pem;
    
    # API 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    # 大文件上传
    client_max_body_size 50M;
    client_body_timeout 300s;
    
    # API 代理
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # WebSocket 特殊处理
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.4 容器化部署

#### Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3001
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - app-network

  # 后端服务
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/3dgenerator
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network

  # 数据库
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=3dgenerator
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - app-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

#### 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    postgresql-client \
    curl

COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["node", "dist/app.js"]
```

## 4. 监控和日志

### 4.1 应用监控

#### PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs 3dgenerator-frontend
pm2 logs 3dgenerator-backend

# 监控面板
pm2 monitor

# 设置自动重启
pm2 startup
pm2 save
```

#### 健康检查端点

```bash
# 前端健康检查
curl -f http://localhost:3000/health || exit 1

# 后端健康检查
curl -f http://localhost:3001/health || exit 1

# 数据库连接检查
curl -f http://localhost:3001/health/db || exit 1
```

### 4.2 系统监控

#### 服务器监控脚本

```bash
#!/bin/bash
# /usr/local/bin/system-monitor.sh

# CPU使用率
cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

# 内存使用率
memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')

# 磁盘使用率
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

# 网络连接数
connection_count=$(netstat -an | grep :80 | wc -l)

# 日志记录
echo "$(date): CPU: ${cpu_usage}%, Memory: ${memory_usage}%, Disk: ${disk_usage}%, Connections: ${connection_count}" >> /var/log/system-monitor.log

# 告警阈值
cpu_threshold=80
memory_threshold=85
disk_threshold=90

if (( $(echo "$cpu_usage > $cpu_threshold" | bc -l) )); then
    echo "CPU usage is high: ${cpu_usage}%" | mail -s "High CPU Alert" admin@3dgenerator.com
fi
```

#### 日志轮转配置

```bash
# /etc/logrotate.d/3dgenerator
/var/log/3dgenerator/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload all
    endscript
}
```

### 4.3 应用性能监控

#### 前端性能指标

```javascript
// 性能监控脚本
const performanceMetrics = {
  // 页面加载时间
  pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  
  // 首屏时间
  firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
  
  // 3D模型加载时间
  modelLoadTime: window.modelLoadEnd - window.modelLoadStart,
  
  // WebGL渲染性能
  webglContext: (() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl ? 'supported' : 'unsupported';
  })()
};

// 发送到监控服务
fetch('/api/metrics/performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(performanceMetrics)
});
```

#### 后端性能监控

```typescript
// 性能监控中间件
import { performance } from 'perf_hooks';

export const performanceMonitor = (req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Math.round(duration),
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // 记录慢查询
    if (duration > 1000) {
      console.warn('Slow query detected:', logData);
    }
    
    // 发送到监控系统
    sendToMonitoring(logData);
  });
  
  next();
};
```

## 5. 备份策略

### 5.1 数据库备份

#### 自动备份脚本

```bash
#!/bin/bash
# /usr/local/bin/backup-database.sh

# 配置
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="3dgenerator_prod"
DB_USER="postgres"
RETENTION_DAYS=30
S3_BUCKET="s3://3dgenerator-backups/database"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 生成备份文件名
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"

# 执行备份
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# 上传到S3
aws s3 cp $BACKUP_FILE $S3_BUCKET/$(basename $BACKUP_FILE)

# 本地备份保留30天
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 发送备份报告
echo "Database backup completed: $(basename $BACKUP_FILE)" | \
  mail -s "Database Backup Report" admin@3dgenerator.com
```

#### 备份恢复

```bash
#!/bin/bash
# /usr/local/bin/restore-database.sh

BACKUP_FILE=$1
DB_NAME="3dgenerator_prod"
DB_USER="postgres"

echo "Starting database restore from $BACKUP_FILE"

# 创建临时数据库
createdb -U $DB_USER temp_restore_db

# 解压并恢复
gunzip -c $BACKUP_FILE | psql -U $DB_USER -d temp_restore_db

# 验证数据完整性
if psql -U $DB_USER -d temp_restore_db -c "SELECT COUNT(*) FROM users;"; then
  echo "Backup validation successful"
  
  # 停止应用
  pm2 stop all
  
  # 删除原数据库
  dropdb -U $DB_USER $DB_NAME
  
  # 重命名临时数据库
  psql -U $DB_USER -c "ALTER DATABASE temp_restore_db RENAME TO $DB_NAME;"
  
  # 重启应用
  pm2 start all
  
  echo "Database restore completed successfully"
else
  echo "Backup validation failed"
  dropdb -U $DB_USER temp_restore_db
  exit 1
fi
```

### 5.2 文件备份

#### 模型文件备份

```bash
#!/bin/bash
# /usr/local/bin/backup-models.sh

# 配置
BACKUP_DIR="/var/backups/models"
MODELS_DIR="/var/www/3dgenerator-models"
S3_BUCKET="s3://3dgenerator-backups/models"
RETENTION_DAYS=90

# 创建备份
tar -czf "${BACKUP_DIR}/models_$(date +%Y%m%d_%H%M%S).tar.gz" -C $MODELS_DIR .

# 上传到S3
aws s3 sync $MODELS_DIR $S3_BUCKET/$(date +%Y%m%d)/

# 清理旧备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
```

## 6. 安全策略

### 6.1 系统安全

#### 防火墙配置

```bash
#!/bin/bash
# /usr/local/bin/setup-firewall.sh

# 安装ufw
sudo apt install ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许的服务
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (限制IP)
sudo ufw allow 6379/tcp  # Redis (限制IP)

# 启用防火墙
sudo ufw enable
```

#### SSL证书管理

```bash
#!/bin/bash
# /usr/local/bin/ssl-renewal.sh

# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 3dgenerator.com -d api.3dgenerator.com

# 自动续期
sudo crontab -e
# 添加: 0 2 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx
```

### 6.2 应用安全

#### 安全头配置

```nginx
# 安全头配置
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;
```

#### 数据库安全

```sql
-- 创建只读用户
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE 3dgenerator_prod TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- 审计日志
CREATE EXTENSION IF NOT EXISTS pg_audit;
```

## 7. 故障处理

### 7.1 常见故障排查

#### 应用无法启动

```bash
# 检查日志
pm2 logs 3dgenerator-backend --lines 50

# 检查端口占用
netstat -tlnp | grep :3001

# 检查环境变量
pm2 env 3dgenerator-backend

# 重新启动
pm2 restart 3dgenerator-backend
```

#### 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U prod_user -d 3dgenerator_prod -c "SELECT 1;"

# 检查网络
netstat -tlnp | grep :5432

# 查看错误日志
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 3D模型生成失败

```bash
# 检查AI服务状态
curl -f https://api.hunyuan.com/health || echo "AI service down"

# 检查文件上传权限
ls -la /var/www/3dgenerator-uploads/

# 检查磁盘空间
df -h

# 查看错误日志
pm2 logs 3dgenerator-backend --lines 100 | grep ERROR
```

### 7.2 应急处理流程

#### 服务完全不可用

```bash
#!/bin/bash
# /usr/local/bin/emergency-restart.sh

echo "Starting emergency restart procedure..."

# 1. 停止所有服务
pm2 stop all
sudo systemctl stop nginx

# 2. 检查系统资源
echo "Checking system resources..."
df -h
free -h
uptime

# 3. 清理临时文件
echo "Cleaning temporary files..."
rm -rf /tmp/3dgenerator-*

# 4. 重启数据库和缓存
echo "Restarting database and cache..."
sudo systemctl restart postgresql
sudo systemctl restart redis-server

# 5. 重启应用
echo "Restarting applications..."
pm2 start all
sudo systemctl start nginx

# 6. 验证服务状态
echo "Verifying service status..."
sleep 10
curl -f http://localhost:3000/health && echo "Frontend OK" || echo "Frontend FAILED"
curl -f http://localhost:3001/health && echo "Backend OK" || echo "Backend FAILED"

echo "Emergency restart completed"
```

## 8. 性能优化

### 8.1 数据库优化

#### 索引优化

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 模型表索引
CREATE INDEX idx_models_user_id ON models(user_id);
CREATE INDEX idx_models_created_at ON models(created_at);
CREATE INDEX idx_models_format ON models(format);
CREATE INDEX idx_models_is_public ON models(is_public);

-- 任务表索引
CREATE INDEX idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX idx_generation_tasks_created_at ON generation_tasks(created_at);
```

#### 查询优化

```sql
-- 慢查询分析
EXPLAIN ANALYZE SELECT * FROM models WHERE user_id = 'xxx' ORDER BY created_at DESC LIMIT 20;

-- 连接池配置
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = 256MB;
ALTER SYSTEM SET effective_cache_size = 1GB;
```

### 8.2 缓存策略

#### Redis 缓存配置

```bash
# /etc/redis/redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### 应用层缓存

```typescript
// Redis缓存封装
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

这个部署和运维手册为3D模型生成Web应用提供了完整的生产环境部署方案，包括系统配置、监控告警、备份策略、安全防护和性能优化等各个方面，确保应用能够稳定、安全、高效地运行。
