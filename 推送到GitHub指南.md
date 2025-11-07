# 推送到 GitHub 指南

## ✅ 已完成的准备工作

1. ✅ Git 仓库已初始化
2. ✅ 所有文件已添加并提交（48个文件，8743行代码）
3. ✅ 分支已重命名为 `main`
4. ✅ 远程仓库已添加：`https://github.com/mixedscene/AI-Travel-Planner.git`

## 📋 当前状态

```bash
分支: main
远程仓库: origin (https://github.com/mixedscene/AI-Travel-Planner.git)
提交信息: "Initial commit: AI Travel Planner 完整实现"
文件数: 48 个文件
代码行数: 8743 行
```

## 🔧 推送方法

### 方法 1：使用命令行推送（推荐）

在项目目录下运行：

```bash
cd C:\Project\AI_TravelPlanner\ai-travel-planner
git push -u origin main
```

如果遇到网络问题，可能需要：

#### A. 配置代理（如果使用代理）

```bash
# HTTP 代理
git config --global http.proxy http://127.0.0.1:端口号
git config --global https.proxy http://127.0.0.1:端口号

# SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:端口号
git config --global https.proxy socks5://127.0.0.1:端口号

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

#### B. 使用 SSH 方式（推荐）

1. 生成 SSH 密钥（如果没有）：
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

2. 复制公钥到 GitHub：
```bash
# 查看公钥
cat ~/.ssh/id_rsa.pub
# 或者在 Windows 上
type %USERPROFILE%\.ssh\id_rsa.pub
```

3. 将公钥添加到 GitHub：
   - 访问 https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容

4. 更改远程仓库地址为 SSH：
```bash
git remote set-url origin git@github.com:mixedscene/AI-Travel-Planner.git
git push -u origin main
```

### 方法 2：使用 GitHub Desktop

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 打开 GitHub Desktop
3. File → Add Local Repository
4. 选择项目目录：`C:\Project\AI_TravelPlanner\ai-travel-planner`
5. 点击 "Publish repository" 按钮

### 方法 3：使用 VS Code Git 扩展

1. 在 VS Code 中打开项目
2. 点击左侧的源代码管理图标
3. 点击 "..." → Push
4. 输入 GitHub 凭据（如果需要）

### 方法 4：手动压缩上传（备用方案）

如果以上方法都不行：

1. 压缩整个项目文件夹（排除 node_modules 和 .git）
2. 在 GitHub 网页上手动上传文件
3. 或者使用 GitHub CLI：
```bash
gh repo clone mixedscene/AI-Travel-Planner
# 复制文件到克隆的目录
# 然后提交并推送
```

## 🔑 GitHub 身份验证

从 2021 年 8 月起，GitHub 不再支持密码验证，需要使用：

### 个人访问令牌（Personal Access Token）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 设置权限（至少选择 `repo` 权限）
4. 生成并复制令牌
5. 在 Git 推送时，使用令牌作为密码

或者使用 **Git Credential Manager**（推荐）：

```bash
# 安装 Git Credential Manager
winget install --id Git.Git -e --source winget

# 推送时会自动弹出浏览器进行 OAuth 认证
git push -u origin main
```

## 📊 提交的内容

本次提交包含：

- ✅ 完整的 React + TypeScript 项目结构
- ✅ Supabase 用户认证系统
- ✅ 阿里云百炼 AI 行程规划
- ✅ 科大讯飞语音识别（已优化）
- ✅ 高德地图集成
- ✅ 费用管理功能
- ✅ Docker 部署配置
- ✅ 完整的 README 文档
- ✅ 数据库初始化脚本

## ⚠️ 注意事项

1. **环境变量文件（.env）不会被推送**，这是正确的安全做法
2. **node_modules 目录不会被推送**，其他用户需要运行 `npm install`
3. **dist 目录不会被推送**，需要运行 `npm run build` 构建
4. 确保 GitHub 仓库的可见性设置符合你的需求（Public/Private）

## 🚀 推送成功后的步骤

1. 在 GitHub 仓库页面设置 Secrets（用于部署）：
   - Settings → Secrets and variables → Actions
   - 添加必要的环境变量（参考 `.github/SECRETS_SETUP.md`）

2. 启用 GitHub Actions（如果需要）：
   - Actions → 启用工作流

3. 设置 Vercel 部署（如果需要）：
   - 在 Vercel 导入 GitHub 仓库
   - 配置环境变量

4. 更新 README.md 中的徽章链接（可选）

## 📞 需要帮助？

如果推送失败，请检查：

1. ✓ 网络连接是否正常
2. ✓ GitHub 凭据是否正确
3. ✓ 防火墙或代理设置
4. ✓ Git 版本是否最新（`git --version`）

运行诊断命令：
```bash
# 测试 GitHub 连接
ssh -T git@github.com

# 查看 Git 配置
git config --list

# 查看远程仓库
git remote -v
```

---

**当前推送命令（已准备好）：**

```bash
cd C:\Project\AI_TravelPlanner\ai-travel-planner
git push -u origin main
```

请根据你的网络环境选择合适的推送方法！

