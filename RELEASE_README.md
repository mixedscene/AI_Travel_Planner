# 🚀 AI旅行规划师 - Docker 镜像快速运行指南

本指南说明如何下载和运行预构建的 Docker 镜像文件。

## 📦 下载镜像文件

### 从 GitHub Release 下载

1. 访问 [GitHub Releases](https://github.com/yourusername/ai-travel-planner/releases)
2. 下载最新版本的 `ai-travel-planner-latest.tar` 文件
3. 保存到本地目录

### 文件信息

- **文件名**: `ai-travel-planner-latest.tar`
- **文件大小**: 约 500MB - 1GB（取决于压缩）
- **包含内容**: 完整的 Docker 镜像，包含所有依赖和应用程序

## 🐳 加载镜像

### Windows 系统

#### 使用 PowerShell

```powershell
# 加载镜像
docker load -i ai-travel-planner-latest.tar

# 验证镜像已加载
docker images | Select-String "ai-travel-planner"
```

#### 使用命令提示符 (CMD)

```cmd
docker load -i ai-travel-planner-latest.tar
docker images
```

### Linux/Mac 系统

```bash
# 加载镜像
docker load -i ai-travel-planner-latest.tar

# 验证镜像已加载
docker images | grep ai-travel-planner
```

### 加载压缩的镜像文件（如果提供了 .tar.gz 文件）

```bash
# Linux/Mac
gunzip -c ai-travel-planner-latest.tar.gz | docker load

# 或者分步操作
gunzip ai-travel-planner-latest.tar.gz
docker load -i ai-travel-planner-latest.tar
```

## ▶️ 运行容器

### 方法1：使用 docker run（快速启动）

#### 基本运行

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=your_alibaba_api_key \
  ai-travel-planner:latest
```

#### 完整配置运行

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=your_alibaba_api_key \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ai-travel-planner:latest
```

### 方法2：使用 docker-compose（推荐）

创建 `docker-compose.run.yml` 文件：

```yaml
services:
  ai-travel-planner:
    image: ai-travel-planner:latest
    container_name: ai-travel-planner
    ports:
      - "8080:80"
    environment:
      - ALIBABA_API_KEY=${ALIBABA_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

创建 `.env` 文件：

```env
ALIBABA_API_KEY=your_alibaba_api_key
```

运行容器：

```bash
docker-compose -f docker-compose.run.yml up -d
```

## 🔧 环境变量配置

### 必需的环境变量

- `ALIBABA_API_KEY` - 阿里云百炼 API 密钥（后端 API 使用）

### 获取 API 密钥

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 创建应用并获取 API Key
3. 将 API Key 设置为环境变量

### 设置环境变量

#### Windows PowerShell

```powershell
$env:ALIBABA_API_KEY="your_api_key"
```

#### Windows CMD

```cmd
set ALIBABA_API_KEY=your_api_key
```

#### Linux/Mac

```bash
export ALIBABA_API_KEY=your_api_key
```

## 🌐 访问应用

### 启动后访问

1. **等待容器启动**（约 10-30 秒）
2. **打开浏览器**访问：http://localhost:8080
3. **健康检查**：http://localhost:8080/api/health

### 检查容器状态

```bash
# 查看容器状态
docker ps | grep ai-travel-planner

# 查看容器日志
docker logs ai-travel-planner

# 实时查看日志
docker logs -f ai-travel-planner
```

## 📋 常用命令

### 容器管理

```bash
# 启动容器
docker start ai-travel-planner

# 停止容器
docker stop ai-travel-planner

# 重启容器
docker restart ai-travel-planner

# 删除容器
docker rm -f ai-travel-planner

# 查看容器日志
docker logs ai-travel-planner

# 查看容器状态
docker ps -a | grep ai-travel-planner
```

### 镜像管理

```bash
# 查看镜像
docker images | grep ai-travel-planner

# 删除镜像
docker rmi ai-travel-planner:latest

# 查看镜像详细信息
docker inspect ai-travel-planner:latest
```

### 进入容器

```bash
# 进入容器 Shell
docker exec -it ai-travel-planner sh

# 在容器内检查服务
docker exec ai-travel-planner wget -O- http://localhost/
docker exec ai-travel-planner wget -O- http://localhost:3000/health
```

## 🔍 故障排查

### 问题1：容器无法启动

**检查日志：**
```bash
docker logs ai-travel-planner
```

**常见原因：**
- 端口 8080 已被占用
- 环境变量未设置
- 镜像未正确加载

**解决方案：**
```bash
# 检查端口占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/Mac

# 使用其他端口
docker run -d -p 8081:80 --name ai-travel-planner ai-travel-planner:latest
```

### 问题2：无法访问应用

**检查步骤：**
1. 确认容器正在运行：`docker ps`
2. 检查容器日志：`docker logs ai-travel-planner`
3. 检查端口映射：`docker port ai-travel-planner`
4. 测试健康检查：`curl http://localhost:8080/api/health`

**解决方案：**
```bash
# 重启容器
docker restart ai-travel-planner

# 检查防火墙设置
# Windows: 检查 Windows 防火墙
# Linux: 检查 iptables 或 firewalld
```

### 问题3：API 功能不可用

**原因：** `ALIBABA_API_KEY` 环境变量未设置或无效

**解决方案：**
```bash
# 重新运行容器并设置环境变量
docker stop ai-travel-planner
docker rm ai-travel-planner
docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_valid_api_key ai-travel-planner:latest
```

### 问题4：镜像加载失败

**错误信息：**
```
open ai-travel-planner-latest.tar: no such file or directory
```

**解决方案：**
1. 确认文件路径正确
2. 确认文件完整性（重新下载）
3. 检查文件权限

```bash
# 检查文件是否存在
ls -lh ai-travel-planner-latest.tar

# 重新加载
docker load -i ai-travel-planner-latest.tar
```

## 📝 完整示例

### Windows 示例

```powershell
# 1. 下载镜像文件（从 GitHub Release）
# 2. 加载镜像
docker load -i ai-travel-planner-latest.tar

# 3. 设置环境变量
$env:ALIBABA_API_KEY="your_api_key"

# 4. 运行容器
docker run -d `
  --name ai-travel-planner `
  -p 8080:80 `
  -e ALIBABA_API_KEY=$env:ALIBABA_API_KEY `
  ai-travel-planner:latest

# 5. 查看日志
docker logs -f ai-travel-planner

# 6. 访问应用
# 浏览器打开 http://localhost:8080
```

### Linux/Mac 示例

```bash
# 1. 下载镜像文件（从 GitHub Release）
# 2. 加载镜像
docker load -i ai-travel-planner-latest.tar

# 3. 设置环境变量
export ALIBABA_API_KEY="your_api_key"

# 4. 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=$ALIBABA_API_KEY \
  ai-travel-planner:latest

# 5. 查看日志
docker logs -f ai-travel-planner

# 6. 访问应用
# 浏览器打开 http://localhost:8080
```

## 🔐 安全提示

1. **API 密钥安全**：
   - 不要将 API 密钥提交到版本控制
   - 使用环境变量或密钥管理服务
   - 定期轮换 API 密钥

2. **网络安全**：
   - 生产环境建议使用 HTTPS
   - 配置防火墙规则
   - 限制容器网络访问

3. **容器安全**：
   - 定期更新基础镜像
   - 扫描镜像漏洞
   - 使用最小权限原则

## 📚 更多信息

- **项目主页**: [GitHub Repository](https://github.com/yourusername/ai-travel-planner)
- **问题反馈**: [GitHub Issues](https://github.com/yourusername/ai-travel-planner/issues)
- **详细文档**: 查看项目 README.md

## 📞 获取帮助

如果遇到问题：

1. 查看 [故障排查](#故障排查) 部分
2. 查看容器日志：`docker logs ai-travel-planner`
3. 提交 [GitHub Issue](https://github.com/yourusername/ai-travel-planner/issues)
4. 查看项目文档

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**祝您使用愉快！** 🎉

