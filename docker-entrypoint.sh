#!/bin/sh
set -e

echo "🚀 启动AI旅行规划器..."

# 检查环境变量
if [ -z "$ALIBABA_API_KEY" ] && [ -z "$VITE_ALIBABA_API_KEY" ]; then
  echo "⚠️  警告: ALIBABA_API_KEY 环境变量未设置，AI功能可能无法使用"
fi

# 启动Node.js API服务
echo "📡 启动API服务..."
cd /app

# 检查server.js是否存在
if [ ! -f "server.js" ]; then
  echo "❌ 错误: server.js 文件不存在"
  exit 1
fi

# 在后台启动Node.js服务
node server.js &
NODE_PID=$!

# 等待API服务启动
echo "⏳ 等待API服务启动..."
sleep 3

# 检查API服务是否运行
if ! kill -0 $NODE_PID 2>/dev/null; then
  echo "❌ 错误: API服务启动失败"
  exit 1
fi

echo "✅ API服务已启动 (PID: $NODE_PID)"

# 测试API健康检查（使用wget或curl）
if command -v wget >/dev/null 2>&1; then
  if wget --no-verbose --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
    echo "✅ API健康检查通过"
  else
    echo "⚠️  警告: API健康检查失败，但继续启动..."
  fi
elif command -v curl >/dev/null 2>&1; then
  if curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ API健康检查通过"
  else
    echo "⚠️  警告: API健康检查失败，但继续启动..."
  fi
else
  echo "⚠️  警告: 未找到wget或curl，跳过API健康检查..."
fi

# 启动Nginx
echo "🌐 启动Nginx..."
exec nginx -g 'daemon off;'

