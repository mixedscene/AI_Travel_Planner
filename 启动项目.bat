@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    AI旅行规划师 - 启动脚本
echo ========================================
echo.

REM 检查 .env 文件
if not exist .env (
    echo ❌ .env 文件不存在！
    echo.
    echo 正在创建 .env 文件...
    copy .env.example .env >nul
    echo ✅ .env 文件已创建
    echo.
    echo ⚠️  请先填写密钥，然后重新运行此脚本
    echo    双击 "打开配置文件.bat" 来编辑配置
    echo.
    pause
    exit /b 1
)

echo ✅ .env 文件存在
echo.

echo 🔍 检查配置状态...
echo.

REM 检查配置
powershell -Command "$missing = 0; Get-Content .env | Select-String 'VITE_(SUPABASE_URL|SUPABASE_ANON_KEY|ALIBABA_API_KEY|AMAP_KEY)' | ForEach-Object { $line = $_.Line; if ($line -match '^(VITE_[^=]+)=(.*)$') { $key = $matches[1]; $value = $matches[2].Trim(); if ($value -eq '') { Write-Host \"❌ $key : 未配置\" -ForegroundColor Red; $missing++ } else { Write-Host \"✅ $key : 已配置\" -ForegroundColor Green } } }; exit $missing"

if errorlevel 1 (
    echo.
    echo ❌ 必需的配置项未填写完整！
    echo.
    echo 请按照以下步骤操作：
    echo   1. 双击 "打开配置文件.bat" 编辑配置
    echo   2. 填写所有标记为 ❌ 的配置项
    echo   3. 保存文件
    echo   4. 重新运行此脚本
    echo.
    echo 📖 查看 QUICK_START.md 获取详细配置指南
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✅ 配置检查通过！
echo ========================================
echo.

REM 检查 node_modules
if not exist node_modules (
    echo ⚠️  依赖未安装，正在安装...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败！
        echo 请检查网络连接或手动运行: npm install
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ✅ 依赖安装完成
    echo.
) else (
    echo ✅ 依赖已安装
    echo.
)

echo ========================================
echo    🚀 启动开发服务器...
echo ========================================
echo.
echo 启动后浏览器会自动打开 http://localhost:5173
echo 按 Ctrl+C 可停止服务器
echo.

npm run dev

