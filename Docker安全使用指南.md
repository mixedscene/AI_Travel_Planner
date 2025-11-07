# Docker 安全使用指南

## 📋 目录
- [安全警告说明](#安全警告说明)
- [最佳实践](#最佳实践)
- [环境变量管理](#环境变量管理)
- [构建和运行](#构建和运行)

## 🔒 安全警告说明

当您运行 `docker build` 时，可能会看到类似以下的安全警告：

```
WARN: SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data
```

### 为什么会出现这些警告？

这些警告是 Docker 的安全检查，提醒您敏感信息不应该通过 `ARG` 或 `ENV` 指令存储在 Dockerfile 中，因为：

1. **镜像层可见性**：ARG 和 ENV 的值会被存储在镜像层中
2. **历史记录泄露**：任何人都可以通过 `docker history` 或 `docker inspect` 查看这些值
3. **镜像共享风险**：如果您共享镜像，敏感信息也会被共享

### 哪些警告是预期的？

对于 **Vite 前端应用**，`VITE_*` 环境变量**必须**在构建时传入，因为：

- Vite 在构建时会将 `VITE_*` 环境变量编译进前端 JavaScript 代码中
- 这是 Vite 的工作方式，无法避免
- 这些变量会在前端代码中可见（这是预期的行为）

**结论**：关于 `VITE_*` 环境变量的警告是**预期的**，可以忽略。

## ✅ 最佳实践

### 1. 构建时环境变量（VITE_*）

**必须**在构建时传入，因为 Vite 需要在构建时编译它们：

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=xxx \
  --build-arg VITE_SUPABASE_ANON_KEY=xxx \
  -t my-app .
```

或使用 docker-compose.yml：

```yaml
services:
  app:
    build:
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
        - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

### 2. 运行时环境变量

**不应该**在 Dockerfile 中设置，应该在运行时传入：

❌ **错误做法**：
```dockerfile
# Dockerfile
ENV ALIBABA_API_KEY=xxx  # 不要这样做！
```

✅ **正确做法**：
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - ALIBABA_API_KEY=${ALIBABA_API_KEY}
```

或使用命令行：
```bash
docker run -e ALIBABA_API_KEY=xxx my-app
```

### 3. 使用 .env 文件

创建 `.env` 文件（不要提交到 Git）：

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
ALIBABA_API_KEY=xxx
```

然后在 docker-compose.yml 中引用：

```yaml
services:
  app:
    build:
      args:
        - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
    environment:
      - ALIBABA_API_KEY=${ALIBABA_API_KEY}
```

## 🔐 环境变量管理

### 构建时变量（必须通过 ARG 传入）

这些变量会被编译进前端代码：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALIBABA_API_KEY`
- `VITE_XFYUN_APP_ID`
- `VITE_XFYUN_API_KEY`
- `VITE_XFYUN_API_SECRET`
- `VITE_AMAP_KEY`
- `VITE_AMAP_SECURITY_CODE`

### 运行时变量（通过 environment 传入）

这些变量只在容器运行时使用：

- `ALIBABA_API_KEY` - 后端 API 服务使用

## 🚀 构建和运行

### 方法 1：使用 docker-compose（推荐）

1. 创建 `.env` 文件：
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际值
```

2. 构建并运行：
```bash
docker-compose up --build
```

### 方法 2：使用 Docker CLI

1. 构建镜像：
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
  --build-arg VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
  --build-arg VITE_ALIBABA_API_KEY=${VITE_ALIBABA_API_KEY} \
  --build-arg VITE_AMAP_KEY=${VITE_AMAP_KEY} \
  -t my-app .
```

2. 运行容器：
```bash
docker run -d \
  -p 8080:80 \
  -e ALIBABA_API_KEY=${ALIBABA_API_KEY} \
  my-app
```

### 方法 3：使用 Docker BuildKit Secrets（高级，更安全）

如果您想更安全地传递构建参数，可以使用 BuildKit secrets：

1. 创建 secrets 文件：
```bash
echo "your_api_key" > .secrets/alibaba_api_key
```

2. 修改 Dockerfile 使用 secrets：
```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=api_key \
    export VITE_ALIBABA_API_KEY=$(cat /run/secrets/api_key) && \
    npm run build
```

3. 构建时传入 secret：
```bash
docker build --secret id=api_key,src=.secrets/alibaba_api_key -t my-app .
```

## 📝 注意事项

1. **不要提交敏感信息**：
   - 将 `.env` 添加到 `.gitignore`
   - 不要将包含真实密钥的 `.env` 文件提交到 Git

2. **生产环境**：
   - 使用环境变量管理服务（如 AWS Secrets Manager、HashiCorp Vault）
   - 使用 Docker secrets（Docker Swarm）或 Kubernetes secrets
   - 不要在镜像中硬编码任何敏感信息

3. **镜像安全**：
   - 定期更新基础镜像
   - 扫描镜像中的安全漏洞
   - 使用多阶段构建减少镜像大小和攻击面

## 🔍 验证环境变量

构建后，您可以验证环境变量是否正确设置：

```bash
# 检查构建时的环境变量（会在前端代码中）
docker run --rm my-app cat /usr/share/nginx/html/assets/*.js | grep -o "VITE_[A-Z_]*"

# 检查运行时环境变量
docker run --rm -e ALIBABA_API_KEY=test my-app env | grep ALIBABA_API_KEY
```

## 📚 参考资源

- [Docker 安全最佳实践](https://docs.docker.com/engine/security/)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Docker BuildKit secrets](https://docs.docker.com/develop/develop-images/build_enhancements/#new-dockerfile-syntax-for-secrets)

---

**最后更新**：2024年

