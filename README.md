# 🌍 AI旅行规划师

一个基于人工智能的智能旅行规划Web应用，帮助用户轻松规划完美的旅行路线。

[![Docker Build](https://github.com/yourusername/ai-travel-planner/actions/workflows/docker-build.yml/badge.svg)](https://github.com/yourusername/ai-travel-planner/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📑 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [Docker部署](#docker部署)
- [详细文档](#详细文档)
- [贡献指南](#贡献指南)

## 功能特性

- ✅ **用户认证系统** - 基于Supabase的注册/登录功能
- ✅ **语音输入** - 科大讯飞语音识别，支持语音描述旅行需求
- 🚧 **AI行程规划** - 阿里云百炼大模型智能生成旅行计划
- 🚧 **地图导航** - 高德地图集成，展示景点和路线
- 🚧 **费用管理** - 记录和分析旅行开销
- 🚧 **云端同步** - 多设备数据同步

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件**: Ant Design
- **构建工具**: Vite
- **状态管理**: React Context + Hooks
- **路由**: React Router v6
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: 阿里云百炼大模型
- **语音识别**: 科大讯飞Web API
- **地图服务**: 高德地图Web API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
# Supabase配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 阿里云百炼配置
VITE_ALIBABA_API_KEY=your_alibaba_api_key
VITE_ALIBABA_API_URL=https://dashscope.aliyuncs.com/api/v1

# 科大讯飞语音识别配置
VITE_XFYUN_APP_ID=your_xfyun_app_id
VITE_XFYUN_API_KEY=your_xfyun_api_key
VITE_XFYUN_API_SECRET=your_xfyun_api_secret

# 高德地图配置
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
```

### 3. 数据库设置

在Supabase管理面板的SQL编辑器中执行 `database_setup.sql` 脚本，创建所需的数据库表和策略。

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 运行。

### 5. 构建生产版本

```bash
npm run build
```

## 🐳 Docker部署

### 快速开始

```bash
# 从阿里云镜像仓库拉取
docker pull registry.cn-hangzhou.aliyuncs.com/[命名空间]/ai-travel-planner:latest

# 运行容器
docker run -d \
  --name ai-travel-planner \
  -p 8080:80 \
  -e ALIBABA_API_KEY=your_api_key \
  registry.cn-hangzhou.aliyuncs.com/[命名空间]/ai-travel-planner:latest

# 访问应用
# 浏览器打开 http://localhost:8080
```

### 使用docker-compose

```bash
# 克隆仓库
git clone https://github.com/yourusername/ai-travel-planner.git
cd ai-travel-planner

# 配置环境变量
cp .env.example .env
# 编辑.env文件

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 自动构建

本项目配置了GitHub Actions，每次推送代码到main分支都会自动构建Docker镜像并推送到阿里云容器镜像服务。

**详细Docker使用指南请查看：** [DOCKER_README.md](DOCKER_README.md)

## API配置指南

### Supabase配置

1. 访问 [Supabase](https://supabase.com/) 创建项目
2. 在项目设置中获取 `URL` 和 `anon key`
3. 在SQL编辑器中执行 `database_setup.sql`

### 科大讯飞语音识别

1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册并创建应用
3. 在"语音听写（流式版）Web API"服务中获取：
   - APPID
   - APIKey
   - APISecret
4. 确保已开通"语音听写"服务

### 阿里云百炼

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 创建应用并获取API Key
3. 选择合适的模型（如通义千问）

### 高德地图

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并创建Web应用
3. 获取Web服务API Key
4. 配置安全密钥（可选）

## 项目结构

```
ai-travel-planner/
├── public/              # 静态资源
├── src/
│   ├── components/      # 可复用组件
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── VoiceRecorder.tsx
│   ├── pages/          # 页面组件
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── CreatePlanPage.tsx
│   │   ├── MyPlansPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/       # API服务
│   │   ├── supabase.ts
│   │   └── xfyun.ts
│   ├── hooks/          # 自定义Hook
│   │   ├── useAuth.tsx
│   │   └── useVoiceInput.ts
│   ├── types/          # TypeScript类型定义
│   │   ├── index.ts
│   │   └── database.ts
│   ├── config/         # 配置文件
│   │   └── env.ts
│   ├── App.tsx         # 应用根组件
│   └── main.tsx        # 应用入口
├── api/                  # Vercel Functions / API服务
│   └── generate-itinerary.js
├── .github/              # GitHub配置
│   ├── workflows/        # GitHub Actions工作流
│   │   └── docker-build.yml
│   └── SECRETS_SETUP.md
├── Dockerfile            # Docker镜像构建文件
├── docker-compose.yml    # Docker Compose配置
├── nginx.conf            # Nginx配置
├── server.js             # Node.js API服务器
├── database_setup.sql    # 数据库初始化脚本
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📚 详细文档

- [Docker部署指南](DOCKER_README.md) - 完整的Docker使用说明
- [提交指南](SUBMISSION_GUIDE.md) - 项目提交流程
- [快速开始](QUICK_START.md) - 快速上手指南
- [用户手册](USER_GUIDE.md) - 详细使用说明
- [环境配置](ENV_SETUP.md) - 环境变量配置详解
- [部署指南](DEPLOYMENT.md) - 生产环境部署
- [CORS问题说明](CORS问题说明.md) - CORS跨域问题解决
- [GitHub Secrets配置](.github/SECRETS_SETUP.md) - CI/CD配置

## 使用说明

### 1. 用户注册/登录

- 访问应用自动跳转到登录页
- 首次使用点击"注册账户"
- 填写邮箱、密码和姓名完成注册
- 查收邮件激活账户后登录

### 2. 创建旅行计划

- 点击"创建新行程"
- 填写目的地、日期、预算等基本信息
- 使用"语音输入需求"功能描述详细需求
- 点击"开始AI智能规划"生成行程

### 3. 语音输入

- 点击"语音输入需求"按钮
- 允许浏览器访问麦克风
- 开始说话描述旅行需求
- 语音内容会自动转换为文字
- 点击"停止录音"结束输入

### 4. 管理行程

- 在"我的行程"查看所有计划
- 点击查看详细行程安排
- 编辑或删除行程计划

## 开发计划

- [x] 项目基础搭建
- [x] 用户认证系统
- [x] 语音识别功能
- [x] AI行程规划
- [x] 地图集成
- [x] 费用管理

## 常见问题

### 语音识别无法使用？

1. 检查浏览器是否支持麦克风权限（需要HTTPS或localhost）
2. 确认已正确配置科大讯飞API密钥
3. 检查浏览器控制台是否有错误信息
4. 确保已开通科大讯飞语音听写服务

### 无法登录/注册？

1. 检查Supabase配置是否正确
2. 确认已执行数据库初始化脚本
3. 检查网络连接
4. 查看浏览器控制台错误信息

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题请提交Issue或联系开发者。
