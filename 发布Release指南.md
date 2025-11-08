# 📦 发布 Docker 镜像到 GitHub Release

本指南说明如何将 Docker 镜像文件发布到 GitHub Release。

## 📋 前提条件

1. 已构建 Docker 镜像文件 `ai-travel-planner-latest.tar`
2. 已安装 Git 和 GitHub CLI（可选）
3. 具有 GitHub 仓库的推送权限

## 🚀 方法1：使用 GitHub CLI（推荐）

### 安装 GitHub CLI

#### Windows

```powershell
# 使用 winget
winget install --id GitHub.cli

# 或使用 Chocolatey
choco install gh
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt install gh

# 或使用官方安装脚本
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### Mac

```bash
brew install gh
```

### 登录 GitHub

```bash
gh auth login
```

### 创建 Release

```bash
# 进入项目目录
cd ai-travel-planner

# 创建 Release（交互式）
gh release create v1.0.0 ai-travel-planner-latest.tar --title "v1.0.0 - AI旅行规划师 Docker 镜像" --notes "## 🚀 快速开始

1. 下载 \`ai-travel-planner-latest.tar\` 文件
2. 加载镜像：\`docker load -i ai-travel-planner-latest.tar\`
3. 运行容器：\`docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_key ai-travel-planner:latest\`

详细说明请查看 [RELEASE_README.md](RELEASE_README.md)"

# 或使用文件中的发布说明
gh release create v1.0.0 ai-travel-planner-latest.tar --title "v1.0.0" --notes-file RELEASE_README.md
```

### 更新 Release

```bash
# 添加文件到现有 Release
gh release upload v1.0.0 ai-travel-planner-latest.tar

# 更新 Release 说明
gh release edit v1.0.0 --notes-file RELEASE_README.md
```

## 🚀 方法2：使用 GitHub Web 界面

### 步骤1：准备文件

确保 `ai-travel-planner-latest.tar` 文件已准备好。

### 步骤2：创建 Release

1. 访问 GitHub 仓库页面
2. 点击 **"Releases"** 链接
3. 点击 **"Draft a new release"** 按钮
4. 填写 Release 信息：
   - **Tag version**: `v1.0.0`（建议使用语义化版本号）
   - **Release title**: `v1.0.0 - AI旅行规划师 Docker 镜像`
   - **Description**: 复制 `RELEASE_README.md` 的内容，或使用以下模板：

```markdown
## 🚀 快速开始

### 1. 下载镜像文件

下载 `ai-travel-planner-latest.tar` 文件到本地。

### 2. 加载镜像

```bash
docker load -i ai-travel-planner-latest.tar
```

### 3. 运行容器

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=your_alibaba_api_key \
  ai-travel-planner:latest
```

### 4. 访问应用

打开浏览器访问：http://localhost:8080

## 📚 详细文档

详细说明请查看 [RELEASE_README.md](RELEASE_README.md)

## 🔧 环境变量

- `ALIBABA_API_KEY` - 阿里云百炼 API 密钥（必需）

## 📝 更新日志

- 初始版本发布
- 包含完整的 Docker 镜像
- 支持一键运行
```

5. 上传文件：
   - 拖拽 `ai-travel-planner-latest.tar` 文件到文件上传区域
   - 或点击 **"Attach binaries"** 按钮选择文件

6. 选择发布类型：
   - **Pre-release**: 如果是测试版本
   - **Latest release**: 如果是正式版本

7. 点击 **"Publish release"** 按钮

### 步骤3：验证 Release

1. 访问 Release 页面
2. 确认文件已上传
3. 测试下载链接

## 🚀 方法3：使用 Git 命令和 API

### 使用 curl 上传文件

```bash
# 设置变量
GITHUB_TOKEN="your_github_token"
GITHUB_OWNER="your_username"
GITHUB_REPO="ai-travel-planner"
VERSION="v1.0.0"

# 创建 Release
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases \
  -d "{
    \"tag_name\": \"$VERSION\",
    \"name\": \"$VERSION - AI旅行规划师 Docker 镜像\",
    \"body\": \"## 快速开始\n\n1. 下载镜像文件\n2. 加载镜像: docker load -i ai-travel-planner-latest.tar\n3. 运行容器: docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_key ai-travel-planner:latest\",
    \"draft\": false,
    \"prerelease\": false
  }" | jq -r '.upload_url' | sed 's/{?name,label}//' > upload_url.txt

# 获取 Release ID
RELEASE_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/tags/$VERSION | jq -r '.id')

# 上传文件
UPLOAD_URL=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/releases/tags/$VERSION | jq -r '.upload_url' | sed 's/{?name,label}//')

curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@ai-travel-planner-latest.tar" \
  "$UPLOAD_URL?name=ai-travel-planner-latest.tar"
```

## 📝 Release 说明模板

### 简洁版本

```markdown
## 🚀 快速开始

1. 下载 `ai-travel-planner-latest.tar`
2. 加载镜像：`docker load -i ai-travel-planner-latest.tar`
3. 运行容器：`docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_key ai-travel-planner:latest`
4. 访问：http://localhost:8080

详细说明请查看 [RELEASE_README.md](RELEASE_README.md)
```

### 完整版本

```markdown
## 🎉 发布说明

本 Release 包含预构建的 Docker 镜像文件，可以直接下载运行。

## 🚀 快速开始

### 1. 下载镜像文件

下载 `ai-travel-planner-latest.tar` 文件到本地。

### 2. 加载镜像

```bash
docker load -i ai-travel-planner-latest.tar
```

### 3. 运行容器

```bash
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=your_alibaba_api_key \
  ai-travel-planner:latest
```

### 4. 访问应用

打开浏览器访问：http://localhost:8080

## 📚 详细文档

完整的使用说明、故障排查和配置指南，请查看 [RELEASE_README.md](RELEASE_README.md)

## 🔧 系统要求

- Docker 20.10 或更高版本
- 至少 2GB 可用磁盘空间
- 端口 8080 可用

## 📝 更新日志

### v1.0.0

- ✅ 初始版本发布
- ✅ 包含完整的 Docker 镜像
- ✅ 支持一键运行
- ✅ 包含健康检查
- ✅ 支持环境变量配置

## 🔗 相关链接

- [项目主页](https://github.com/yourusername/ai-travel-planner)
- [问题反馈](https://github.com/yourusername/ai-travel-planner/issues)
- [使用文档](RELEASE_README.md)
```

## 🔄 更新现有 Release

### 使用 GitHub CLI

```bash
# 添加新文件到现有 Release
gh release upload v1.0.0 ai-travel-planner-latest.tar --clobber

# 更新 Release 说明
gh release edit v1.0.0 --notes-file RELEASE_README.md
```

### 使用 Web 界面

1. 访问 Release 页面
2. 点击 **"Edit release"**
3. 更新说明或添加文件
4. 点击 **"Update release"**

## 📋 发布检查清单

发布前请确认：

- [ ] Docker 镜像文件已构建
- [ ] 镜像文件大小合理（已压缩）
- [ ] RELEASE_README.md 文档已更新
- [ ] 版本号已更新
- [ ] 更新日志已填写
- [ ] 环境变量说明已更新
- [ ] 故障排查部分已完善
- [ ] 已测试镜像加载和运行
- [ ] GitHub Release 说明已准备

## 🎯 最佳实践

1. **版本号管理**：使用语义化版本号（Semantic Versioning）
   - 格式：`v主版本号.次版本号.修订号`
   - 示例：`v1.0.0`, `v1.1.0`, `v2.0.0`

2. **文件命名**：使用清晰的命名约定
   - 格式：`项目名-版本号.tar` 或 `项目名-latest.tar`

3. **文件大小**：如果文件过大，考虑压缩
   - 使用 `gzip` 压缩：`docker save image:tag | gzip > image.tar.gz`

4. **发布说明**：提供清晰的快速开始指南
   - 包含下载、加载、运行的完整步骤
   - 链接到详细文档

5. **测试**：发布前在干净环境中测试
   - 测试镜像加载
   - 测试容器运行
   - 测试应用访问

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub CLI 文档：https://cli.github.com/manual/
2. 查看 GitHub API 文档：https://docs.github.com/en/rest
3. 提交 Issue 获取帮助

---

**祝您发布顺利！** 🎉

