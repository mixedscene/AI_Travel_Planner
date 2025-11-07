# 多阶段构建
# 阶段1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建参数 - 在构建时传入环境变量
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ALIBABA_API_KEY
ARG VITE_XFYUN_APP_ID
ARG VITE_XFYUN_API_KEY
ARG VITE_XFYUN_API_SECRET
ARG VITE_AMAP_KEY
ARG VITE_AMAP_SECURITY_CODE

# 设置环境变量
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_ALIBABA_API_KEY=$VITE_ALIBABA_API_KEY
ENV VITE_XFYUN_APP_ID=$VITE_XFYUN_APP_ID
ENV VITE_XFYUN_API_KEY=$VITE_XFYUN_API_KEY
ENV VITE_XFYUN_API_SECRET=$VITE_XFYUN_API_SECRET
ENV VITE_AMAP_KEY=$VITE_AMAP_KEY
ENV VITE_AMAP_SECURITY_CODE=$VITE_AMAP_SECURITY_CODE

# 构建项目
RUN npm run build

# 阶段2: 运行阶段
FROM nginx:alpine

# 安装Node.js用于运行Vercel Functions
RUN apk add --no-cache nodejs npm

# 创建必要的目录
RUN mkdir -p /app/api /var/cache/nginx /var/run

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制API函数
COPY --from=builder /app/api /app/api
COPY --from=builder /app/package*.json /app/

# 安装API依赖
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

