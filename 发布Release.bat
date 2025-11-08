@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   发布 Docker 镜像到 GitHub Release
echo ========================================
echo.

:: 设置变量
set IMAGE_FILE=ai-travel-planner-latest.tar
set RELEASE_README=RELEASE_README.md

:: 检查文件是否存在
echo [1/5] 检查文件...
if not exist %IMAGE_FILE% (
    echo ❌ 错误: %IMAGE_FILE% 文件不存在
    echo 请先构建 Docker 镜像文件
    pause
    exit /b 1
)
echo ✅ 找到镜像文件: %IMAGE_FILE%

if not exist %RELEASE_README% (
    echo ⚠️  警告: %RELEASE_README% 文件不存在
) else (
    echo ✅ 找到发布说明文件: %RELEASE_README%
)
echo.

:: 检查文件大小
echo [2/5] 检查文件大小...
for %%A in (%IMAGE_FILE%) do (
    set FILE_SIZE=%%~zA
    set /a FILE_SIZE_MB=!FILE_SIZE!/1024/1024
    echo 文件大小: !FILE_SIZE_MB! MB
)
echo.

:: 检查 GitHub CLI
echo [3/5] 检查 GitHub CLI...
where gh >nul 2>&1
if errorlevel 1 (
    echo ❌ GitHub CLI 未安装
    echo.
    echo 请选择发布方式:
    echo 1. 安装 GitHub CLI 后使用命令行发布（推荐）
    echo 2. 使用 GitHub Web 界面手动发布
    echo.
    echo GitHub CLI 安装:
    echo   winget install --id GitHub.cli
    echo   或访问: https://cli.github.com/
    echo.
    echo 手动发布步骤:
    echo 1. 访问 GitHub 仓库的 Releases 页面
    echo 2. 点击 "Draft a new release"
    echo 3. 上传 %IMAGE_FILE% 文件
    echo 4. 复制 %RELEASE_README% 的内容作为发布说明
    echo.
    pause
    exit /b 1
)
echo ✅ GitHub CLI 已安装
echo.

:: 检查登录状态
echo [4/5] 检查 GitHub 登录状态...
gh auth status >nul 2>&1
if errorlevel 1 (
    echo ❌ 未登录 GitHub
    echo 正在启动登录流程...
    gh auth login
    if errorlevel 1 (
        echo ❌ 登录失败
        pause
        exit /b 1
    )
)
echo ✅ 已登录 GitHub
echo.

:: 获取版本号
echo [5/5] 准备发布...
echo.
set /p VERSION="请输入版本号 (例如: v1.0.0): "
if "!VERSION!"=="" (
    echo ❌ 版本号不能为空
    pause
    exit /b 1
)

:: 确认发布信息
echo.
echo ========================================
echo   发布信息
echo ========================================
echo 版本号: !VERSION!
echo 镜像文件: %IMAGE_FILE!
for %%A in (%IMAGE_FILE%) do (
    set /a FILE_SIZE_MB=%%~zA/1024/1024
    echo 文件大小: !FILE_SIZE_MB! MB
)
echo.
set /p CONFIRM="确认发布? (Y/n): "
if /i "!CONFIRM!"=="n" (
    echo 已取消发布
    pause
    exit /b 0
)

:: 创建 Release
echo.
echo 正在创建 Release...
echo.

if exist %RELEASE_README% (
    gh release create !VERSION! %IMAGE_FILE! --title "!VERSION! - AI旅行规划师 Docker 镜像" --notes-file %RELEASE_README%
) else (
    gh release create !VERSION! %IMAGE_FILE! --title "!VERSION! - AI旅行规划师 Docker 镜像" --notes "## 🚀 快速开始

1. 下载 \`%IMAGE_FILE%\` 文件
2. 加载镜像: \`docker load -i %IMAGE_FILE%\`
3. 运行容器: \`docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_key ai-travel-planner:latest\`

详细说明请查看项目文档。"
)

if errorlevel 1 (
    echo.
    echo ❌ 发布失败
    echo 可能的原因:
    echo 1. 版本号已存在
    echo 2. 网络连接问题
    echo 3. 权限不足
    echo.
    echo 请检查错误信息或使用 GitHub Web 界面手动发布
    pause
    exit /b 1
)

echo.
echo ========================================
echo   发布成功！
echo ========================================
echo.
echo Release 链接:
gh release view !VERSION! --web
echo.
echo 下一步:
echo 1. 访问 Release 页面确认文件已上传
echo 2. 测试下载链接
echo 3. 更新项目 README 中的下载链接
echo.
pause

