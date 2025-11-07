#!/bin/sh
set -e

echo "🚀 启动AI旅行规划器..."

# 启动Node.js API服务
echo "📡 启动API服务..."
cd /app
node server.js &

# 等待API服务启动
sleep 2

# 启动Nginx
echo "🌐 启动Nginx..."
exec nginx -g 'daemon off;'

