# 多阶段构建
# 阶段1: 构建阶段
# 使用国内镜像源加速（如果无法连接Docker Hub，可以尝试使用阿里云镜像）
# 阿里云镜像：registry.cn-hangzhou.aliyuncs.com/acs/node:18-alpine
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies，构建时需要）
RUN npm ci && npm cache clean --force

# 复制源代码（包括 .env 文件）
COPY . .

# 构建项目（.env 文件中的环境变量会被 Vite 自动读取并编译进代码）
RUN npm run build

# 阶段2: 运行阶段
# 使用国内镜像源加速（如果无法连接Docker Hub，可以尝试使用阿里云镜像）
# 阿里云镜像：registry.cn-hangzhou.aliyuncs.com/acs/nginx:alpine
FROM nginx:alpine

# 安装Node.js和wget用于运行API服务和健康检查
RUN apk add --no-cache nodejs npm wget

# 创建必要的目录
RUN mkdir -p /app/api /var/cache/nginx /var/run /var/log/nginx

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制API服务文件
COPY --from=builder /app/server.js /app/server.js
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/.env /app/.env

# 安装API依赖（只需要运行时依赖）
WORKDIR /app
RUN npm ci --only=production

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]

