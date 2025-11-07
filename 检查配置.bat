@echo off
chcp 65001 >nul
echo.
echo 🔍 检查环境变量配置...
echo.

powershell -Command "Get-Content .env | Select-String 'VITE_' | ForEach-Object { $line = $_.Line; if ($line -match '^(VITE_[^=]+)=(.*)$') { $key = $matches[1]; $value = $matches[2].Trim(); if ($value -eq '') { Write-Host \"$key : [未配置]\" -ForegroundColor Red } else { $preview = if ($value.Length -gt 40) { $value.Substring(0, 40) + '...' } else { $value }; Write-Host \"$key : $preview\" -ForegroundColor Green } } }"

echo.
echo 按任意键继续...
pause >nul

