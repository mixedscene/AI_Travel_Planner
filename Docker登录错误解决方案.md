# Docker登录错误解决方案

## 🚨 错误信息
```
Run docker/login-action@v3
with:
  registry: registry.cn-hangzhou.aliyuncs.com
  logout: true
env:
  REGISTRY: registry.cn-hangzhou.aliyuncs.com
  IMAGE_NAME: ai-travel-planner
Error: Username and password required
```

## 🔍 问题原因

GitHub Actions 尝试登录阿里云容器镜像服务时，缺少必要的用户名和密码凭证。

## 🛠️ 解决步骤

### 步骤 1：获取阿里云容器镜像服务凭证

#### 1.1 开通阿里云容器镜像服务

1. 访问 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 如果首次使用，点击"立即开通"

#### 1.2 创建命名空间

1. 在控制台左侧菜单点击 **"命名空间"**
2. 点击 **"创建命名空间"**
3. 填写信息：
   - **命名空间名称**：例如 `ai-travel`（记住这个名称）
   - **可见性**：选择 "公开" 或 "私有"
4. 点击 **"确定"**

#### 1.3 设置访问凭证

1. 点击控制台右上角的 **头像**
2. 选择 **"访问凭证"**
3. 在 "容器镜像服务" 部分：
   - 如果未设置，点击 **"设置Registry登录密码"**
   - 输入一个安全的密码（至少8位，包含字母和数字）
   - 确认密码
4. 记录以下信息：
   - **用户名**：你的阿里云账号邮箱（完整邮箱地址）
   - **密码**：刚才设置的Registry密码
   - **命名空间**：步骤1.2中创建的命名空间名称

### 步骤 2：在GitHub配置Secrets

#### 2.1 进入GitHub仓库设置

1. 打开你的GitHub仓库：`https://github.com/mixedscene/AI-Travel-Planner`
2. 点击 **"Settings"** 标签页
3. 在左侧菜单中点击 **"Secrets and variables"** → **"Actions"**

#### 2.2 添加必需的Secrets

点击 **"New repository secret"** 按钮，依次添加以下Secrets：

| Secret名称 | 值 | 说明 |
|-----------|---|------|
| `ALIYUN_REGISTRY_USERNAME` | 你的阿里云账号邮箱 | 例如：`example@gmail.com` |
| `ALIYUN_REGISTRY_PASSWORD` | Registry登录密码 | 步骤1.3中设置的密码 |
| `ALIYUN_NAMESPACE` | 命名空间名称 | 步骤1.2中创建的命名空间 |

#### 2.3 添加应用环境变量（可选但推荐）

为了完整的CI/CD流程，还需要添加以下Secrets：

| Secret名称 | 说明 | 是否必需 |
|-----------|------|---------|
| `VITE_SUPABASE_URL` | Supabase项目URL | ✅ 必需 |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名密钥 | ✅ 必需 |
| `VITE_ALIBABA_API_KEY` | 阿里云百炼API密钥 | ✅ 必需 |
| `VITE_XFYUN_APP_ID` | 科大讯飞AppID | 可选 |
| `VITE_XFYUN_API_KEY` | 科大讯飞API Key | 可选 |
| `VITE_XFYUN_API_SECRET` | 科大讯飞API Secret | 可选 |
| `VITE_AMAP_KEY` | 高德地图Key | ✅ 必需 |

### 步骤 3：验证配置

#### 3.1 触发构建

1. 推送代码到 `main` 分支，或者
2. 在GitHub仓库的 **"Actions"** 标签页手动触发工作流

#### 3.2 检查构建状态

1. 进入 **"Actions"** 标签页
2. 查看最新的工作流运行
3. 如果仍有错误，查看详细日志

## 📋 配置检查清单

在配置完成后，请确认：

- [ ] 阿里云容器镜像服务已开通
- [ ] 命名空间已创建
- [ ] Registry登录密码已设置
- [ ] GitHub Secrets 中已添加：
  - [ ] `ALIYUN_REGISTRY_USERNAME`
  - [ ] `ALIYUN_REGISTRY_PASSWORD`
  - [ ] `ALIYUN_NAMESPACE`
- [ ] 所有Secret值都正确无误
- [ ] 没有多余的空格或特殊字符

## 🔧 常见问题解决

### 问题1：用户名格式错误

**错误**：`Error: unauthorized: authentication required`

**解决**：确保用户名是完整的邮箱地址，不是阿里云账号ID

### 问题2：密码错误

**错误**：`Error: unauthorized: authentication required`

**解决**：
1. 重新设置Registry登录密码
2. 更新GitHub Secret中的密码

### 问题3：命名空间不存在

**错误**：`Error: repository name not known to registry`

**解决**：
1. 检查命名空间是否已创建
2. 确认命名空间名称拼写正确

### 问题4：区域不匹配

**错误**：连接超时或无法访问

**解决**：确认使用的Registry地址与你的阿里云区域匹配：

- 华东1（杭州）：`registry.cn-hangzhou.aliyuncs.com`
- 华北2（北京）：`registry.cn-beijing.aliyuncs.com`
- 华南1（深圳）：`registry.cn-shenzhen.aliyuncs.com`

## 🎯 完整配置示例

假设你的配置如下：

```
阿里云账号：example@gmail.com
Registry密码：MySecure123!
命名空间：ai-travel
区域：华东1（杭州）
```

则GitHub Secrets应该配置为：

```
ALIYUN_REGISTRY_USERNAME = example@gmail.com
ALIYUN_REGISTRY_PASSWORD = MySecure123!
ALIYUN_NAMESPACE = ai-travel
```

构建成功后，Docker镜像将推送到：
```
registry.cn-hangzhou.aliyuncs.com/ai-travel/ai-travel-planner:latest
```

## 🚀 验证成功

配置正确后，你应该看到：

1. GitHub Actions 构建成功 ✅
2. 在阿里云控制台能看到推送的镜像 ✅
3. 可以使用以下命令拉取镜像：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/[你的命名空间]/ai-travel-planner:latest
```

## 📞 需要帮助？

如果按照以上步骤仍然遇到问题：

1. 检查GitHub Actions的详细日志
2. 确认阿里云账号权限正常
3. 尝试在本地使用相同凭证登录Docker Registry：

```bash
docker login registry.cn-hangzhou.aliyuncs.com
# 输入用户名和密码
```

如果本地登录成功，说明凭证正确，问题可能在GitHub Secrets配置上。
