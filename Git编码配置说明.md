# Git 中文编码配置说明

## 问题描述
在Windows环境下使用Git时，中文提交信息可能出现乱码，如：
- `AI Travel Planner 完整实现` 显示为 `AI Travel Planner 瀹屾暣瀹炵幇`

## 解决方案

### 1. 全局Git配置（推荐）

在命令行中执行以下命令：

```bash
# 设置Git不对非ASCII字符进行转义
git config --global core.quotepath false

# 设置提交信息编码为UTF-8
git config --global i18n.commitencoding utf-8

# 设置日志输出编码为UTF-8
git config --global i18n.logoutputencoding utf-8

# 设置GUI编码为UTF-8
git config --global gui.encoding utf-8

# 设置编辑器（可选）
git config --global core.editor "notepad"
```

### 2. PowerShell编码配置

在PowerShell中执行：

```powershell
# 设置控制台代码页为UTF-8
chcp 65001

# 设置PowerShell输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### 3. 项目级配置

在项目根目录创建 `.gitconfig` 文件（已创建）：

```ini
[core]
	quotepath = false
	editor = notepad
[i18n]
	commitencoding = utf-8
	logoutputencoding = utf-8
[gui]
	encoding = utf-8
```

## 最佳实践

### 1. 提交信息建议

为了避免编码问题，建议：

- **优先使用英文**提交信息
- 如需使用中文，确保编码配置正确
- 使用标准的提交信息格式

### 2. 标准提交格式

```
type(scope): description

body

footer
```

示例：
```
feat: add voice recognition feature

- Integrate iFlytek voice API
- Support real-time speech-to-text
- Optimize recognition accuracy

Closes #123
```

### 3. 提交类型

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 验证配置

检查Git配置是否正确：

```bash
# 查看所有配置
git config --list

# 查看编码相关配置
git config --get core.quotepath
git config --get i18n.commitencoding
git config --get i18n.logoutputencoding
```

## 已修复的问题

✅ 修复了初始提交的中文乱码问题
✅ 配置了正确的Git编码设置
✅ 创建了项目级配置文件
✅ 强制推送了修复后的提交历史

现在GitHub上的提交信息应该显示为：
`Initial commit: AI Travel Planner Complete Implementation`

## 注意事项

1. **强制推送风险**：使用 `git push -f` 会覆盖远程历史，仅在必要时使用
2. **团队协作**：如果是团队项目，需要通知其他成员重新克隆仓库
3. **备份重要**：在进行历史修改前，建议备份重要数据

## 后续维护

- 所有团队成员都应配置相同的Git编码设置
- 建议在项目README中说明编码配置要求
- 定期检查提交信息的显示是否正常
