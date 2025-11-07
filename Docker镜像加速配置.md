# Docker 镜像加速配置指南

## 问题描述

在构建 Docker 镜像时，可能会遇到无法连接到 Docker Hub 的问题：
```
failed to solve: failed to fetch anonymous token: Get "https://auth.docker.io/token?scope=repository%3Alibrary%2Fnginx%3Apull&service=registry.docker.io": dial tcp 74.86.118.24:443: connectex: A connection attempt failed
```

## 解决方案

### 方案1：配置 Docker 镜像加速器（推荐）

#### Windows Docker Desktop

1. **打开 Docker Desktop**
   - 点击系统托盘中的 Docker 图标
   - 选择 "Settings"（设置）

2. **配置镜像加速器**
   - 进入 "Docker Engine" 选项卡
   - 在 JSON 配置中添加以下内容：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "insecure-registries": [],
  "debug": false,
  "experimental": false
}
```

3. **应用并重启**
   - 点击 "Apply & Restart"
   - 等待 Docker 重启完成

#### Linux / macOS

编辑或创建 `/etc/docker/daemon.json` 文件：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ]
}
```

然后重启 Docker 服务：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 方案2：使用国内镜像源（直接修改 Dockerfile）

如果方案1不起作用，可以直接在 Dockerfile 中使用国内镜像源。

#### 创建 Dockerfile.china（使用国内镜像源）

```dockerfile
# 使用阿里云镜像源
FROM registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ALIBABA_API_KEY
ARG VITE_XFYUN_APP_ID
ARG VITE_XFYUN_API_KEY
ARG VITE_XFYUN_API_SECRET
ARG VITE_AMAP_KEY
ARG VITE_AMAP_SECURITY_CODE

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_ALIBABA_API_KEY=$VITE_ALIBABA_API_KEY
ENV VITE_XFYUN_APP_ID=$VITE_XFYUN_APP_ID
ENV VITE_XFYUN_API_KEY=$VITE_XFYUN_API_KEY
ENV VITE_XFYUN_API_SECRET=$VITE_XFYUN_API_SECRET
ENV VITE_AMAP_KEY=$VITE_AMAP_KEY
ENV VITE_AMAP_SECURITY_CODE=$VITE_AMAP_SECURITY_CODE
ENV ALIBABA_API_KEY=$VITE_ALIBABA_API_KEY

RUN npm run build

FROM registry.cn-hangzhou.aliyuncs.com/acs/nginx:alpine

RUN apk add --no-cache nodejs npm wget

RUN mkdir -p /app/api /var/cache/nginx /var/run /var/log/nginx

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/server.js /app/server.js
COPY --from=builder /app/package*.json /app/

WORKDIR /app
RUN npm ci --only=production

COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
```

#### 使用国内镜像源构建

```bash
# 使用 Dockerfile.china 构建
docker build -f Dockerfile.china -t ai-travel-planner:latest .

# 或使用 docker-compose（需要修改 docker-compose.yml 中的 dockerfile 路径）
docker-compose -f docker-compose.yml build --file Dockerfile.china
```

### 方案3：手动拉取镜像

如果以上方案都不行，可以手动从国内镜像源拉取基础镜像：

```bash
# 拉取 Node.js 镜像
docker pull registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine
docker tag registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine node:18-alpine

# 拉取 Nginx 镜像
docker pull registry.cn-hangzhou.aliyuncs.com/acs/nginx:alpine
docker tag registry.cn-hangzhou.aliyuncs.com/acs/nginx:alpine nginx:alpine

# 然后正常构建
docker-compose build
```

### 方案4：使用代理

如果你有可用的代理，可以配置 Docker 使用代理：

#### Windows Docker Desktop

1. 打开 Docker Desktop Settings
2. 进入 "Resources" → "Proxies"
3. 配置 HTTP/HTTPS 代理
4. 点击 "Apply & Restart"

#### Linux

创建 `/etc/systemd/system/docker.service.d/http-proxy.conf`：

```ini
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
```

然后重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 验证配置

配置完成后，可以测试镜像拉取：

```bash
# 测试拉取镜像
docker pull nginx:alpine
docker pull node:18-alpine

# 如果成功，说明配置生效
```

## 常用国内镜像源

- **中科大镜像**：https://docker.mirrors.ustc.edu.cn
- **网易镜像**：https://hub-mirror.c.163.com
- **百度云镜像**：https://mirror.baidubce.com
- **腾讯云镜像**：https://ccr.ccs.tencentyun.com
- **阿里云镜像**：https://registry.cn-hangzhou.aliyuncs.com（需要登录）

## 注意事项

1. **镜像源选择**：建议使用多个镜像源，Docker 会自动尝试可用的镜像源
2. **安全性**：使用国内镜像源时，确保来源可信
3. **更新**：定期更新镜像源配置，某些镜像源可能会失效
4. **网络环境**：不同网络环境下，可用的镜像源可能不同

## 故障排查

如果配置后仍然无法拉取镜像：

1. **检查网络连接**：
   ```bash
   ping docker.mirrors.ustc.edu.cn
   ```

2. **检查 Docker 配置**：
   ```bash
   docker info | grep -A 10 "Registry Mirrors"
   ```

3. **查看 Docker 日志**：
   ```bash
   docker logs <container_id>
   ```

4. **清理 Docker 缓存**：
   ```bash
   docker system prune -a
   ```

5. **重启 Docker 服务**：
   - Windows: 重启 Docker Desktop
   - Linux: `sudo systemctl restart docker`

## 参考链接

- [Docker 官方文档 - 配置镜像加速器](https://docs.docker.com/registry/recipes/mirror/)
- [中科大镜像站](https://mirrors.ustc.edu.cn/)

