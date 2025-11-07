# GitHub Secrets 配置指南

为了使GitHub Actions能够自动构建和推送Docker镜像到阿里云，您需要在GitHub仓库中配置以下Secrets。

## 配置步骤

1. 进入您的GitHub仓库
2. 点击 `Settings` > `Secrets and variables` > `Actions`
3. 点击 `New repository secret` 添加以下密钥

## 必需的Secrets

### 阿里云容器镜像服务

| Secret名称 | 说明 | 获取方式 |
|-----------|------|---------|
| `ALIYUN_REGISTRY_USERNAME` | 阿里云容器镜像服务用户名 | 通常是阿里云账号的完整邮箱 |
| `ALIYUN_REGISTRY_PASSWORD` | 阿里云容器镜像服务密码 | 在容器镜像服务控制台设置 |
| `ALIYUN_NAMESPACE` | 阿里云镜像命名空间 | 在容器镜像服务控制台创建 |

### 应用环境变量（前端）

| Secret名称 | 说明 | 是否必需 |
|-----------|------|---------|
| `VITE_SUPABASE_URL` | Supabase项目URL | ✅ 必需 |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名密钥 | ✅ 必需 |
| `VITE_ALIBABA_API_KEY` | 阿里云百炼API密钥 | ✅ 必需 |
| `VITE_XFYUN_APP_ID` | 科大讯飞AppID | 可选 |
| `VITE_XFYUN_API_KEY` | 科大讯飞API Key | 可选 |
| `VITE_XFYUN_API_SECRET` | 科大讯飞API Secret | 可选 |
| `VITE_AMAP_KEY` | 高德地图Key | ✅ 必需 |
| `VITE_AMAP_SECURITY_CODE` | 高德地图安全密钥 | 可选 |

### 应用环境变量（后端）

| Secret名称 | 说明 | 是否必需 |
|-----------|------|---------|
| `ALIBABA_API_KEY` | 阿里云百炼API密钥（后端用） | ✅ 必需 |

**注意：** `ALIBABA_API_KEY` 和 `VITE_ALIBABA_API_KEY` 可以使用相同的值。

## 获取阿里云容器镜像服务凭证

### 1. 开通服务

访问 [阿里云容器镜像服务](https://cr.console.aliyun.com/)

### 2. 创建命名空间

1. 进入 `命名空间` 页面
2. 点击 `创建命名空间`
3. 输入命名空间名称（例如：`my-namespace`）
4. 选择 `公开` 或 `私有`
5. 记录命名空间名称，用作 `ALIYUN_NAMESPACE`

### 3. 设置访问凭证

1. 点击右上角头像 > `访问凭证`
2. 设置Registry登录密码
3. 记录：
   - 用户名（通常是您的阿里云账号邮箱）
   - 密码（您刚设置的密码）

### 4. 选择区域

默认使用杭州区域：`registry.cn-hangzhou.aliyuncs.com`

如需更改，请修改 `.github/workflows/docker-build.yml` 中的 `REGISTRY` 环境变量。

可用区域：
- 华东1（杭州）：`registry.cn-hangzhou.aliyuncs.com`
- 华北2（北京）：`registry.cn-beijing.aliyuncs.com`
- 华南1（深圳）：`registry.cn-shenzhen.aliyuncs.com`
- 华东2（上海）：`registry.cn-shanghai.aliyuncs.com`

## 配置示例

假设您的配置如下：

- 阿里云账号邮箱：`example@example.com`
- 设置的Registry密码：`MySecurePassword123!`
- 创建的命名空间：`ai-travel`

则在GitHub Secrets中添加：

```
ALIYUN_REGISTRY_USERNAME = example@example.com
ALIYUN_REGISTRY_PASSWORD = MySecurePassword123!
ALIYUN_NAMESPACE = ai-travel
```

## 验证配置

配置完成后，推送代码到main/master分支，GitHub Actions会自动触发构建。

您可以在仓库的 `Actions` 标签页查看构建状态。

构建成功后，镜像将推送到：

```
registry.cn-hangzhou.aliyuncs.com/[您的命名空间]/ai-travel-planner:latest
```

## 故障排查

### 登录失败

- 检查用户名是否正确（应该是完整的邮箱地址）
- 检查密码是否正确
- 确认已在容器镜像服务中设置了访问凭证

### 推送失败

- 检查命名空间是否存在
- 确认命名空间名称拼写正确
- 检查账号权限

### 构建失败

- 检查所有环境变量Secrets是否已配置
- 查看GitHub Actions日志获取详细错误信息
- 确认代码可以在本地成功构建

## 安全建议

1. **定期更新密码**：建议每3-6个月更新一次Registry密码
2. **最小权限原则**：使用RAM子账号，只授予必要的权限
3. **私有镜像**：生产环境建议使用私有命名空间
4. **定期清理**：清理不需要的旧版本镜像节省空间

