#!/bin/bash

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "   发布 Docker 镜像到 GitHub Release"
echo "========================================"
echo

# 设置变量
IMAGE_FILE="ai-travel-planner-latest.tar"
RELEASE_README="RELEASE_README.md"

# 检查文件是否存在
echo "[1/5] 检查文件..."
if [ ! -f "$IMAGE_FILE" ]; then
    echo -e "${RED}❌ 错误: ${IMAGE_FILE} 文件不存在${NC}"
    echo "请先构建 Docker 镜像文件"
    exit 1
fi
echo -e "${GREEN}✅ 找到镜像文件: ${IMAGE_FILE}${NC}"

if [ ! -f "$RELEASE_README" ]; then
    echo -e "${YELLOW}⚠️  警告: ${RELEASE_README} 文件不存在${NC}"
else
    echo -e "${GREEN}✅ 找到发布说明文件: ${RELEASE_README}${NC}"
fi
echo

# 检查文件大小
echo "[2/5] 检查文件大小..."
FILE_SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
echo "文件大小: ${FILE_SIZE}"
echo

# 检查 GitHub CLI
echo "[3/5] 检查 GitHub CLI..."
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI 未安装${NC}"
    echo
    echo "请选择发布方式:"
    echo "1. 安装 GitHub CLI 后使用命令行发布（推荐）"
    echo "2. 使用 GitHub Web 界面手动发布"
    echo
    echo "GitHub CLI 安装:"
    echo "  Linux: sudo apt install gh"
    echo "  Mac: brew install gh"
    echo "  或访问: https://cli.github.com/"
    echo
    echo "手动发布步骤:"
    echo "1. 访问 GitHub 仓库的 Releases 页面"
    echo "2. 点击 'Draft a new release'"
    echo "3. 上传 ${IMAGE_FILE} 文件"
    echo "4. 复制 ${RELEASE_README} 的内容作为发布说明"
    echo
    exit 1
fi
echo -e "${GREEN}✅ GitHub CLI 已安装${NC}"
echo

# 检查登录状态
echo "[4/5] 检查 GitHub 登录状态..."
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ 未登录 GitHub${NC}"
    echo "正在启动登录流程..."
    if ! gh auth login; then
        echo -e "${RED}❌ 登录失败${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ 已登录 GitHub${NC}"
echo

# 获取版本号
echo "[5/5] 准备发布..."
echo
read -p "请输入版本号 (例如: v1.0.0): " VERSION
if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ 版本号不能为空${NC}"
    exit 1
fi

# 确认发布信息
echo
echo "========================================"
echo "   发布信息"
echo "========================================"
echo "版本号: ${VERSION}"
echo "镜像文件: ${IMAGE_FILE}"
FILE_SIZE=$(du -h "$IMAGE_FILE" | cut -f1)
echo "文件大小: ${FILE_SIZE}"
echo
read -p "确认发布? (Y/n): " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [ "$CONFIRM" = "n" ] || [ "$CONFIRM" = "N" ]; then
    echo "已取消发布"
    exit 0
fi

# 创建 Release
echo
echo "正在创建 Release..."
echo

if [ -f "$RELEASE_README" ]; then
    gh release create "$VERSION" "$IMAGE_FILE" \
        --title "${VERSION} - AI旅行规划师 Docker 镜像" \
        --notes-file "$RELEASE_README"
else
    gh release create "$VERSION" "$IMAGE_FILE" \
        --title "${VERSION} - AI旅行规划师 Docker 镜像" \
        --notes "## 🚀 快速开始

1. 下载 \`${IMAGE_FILE}\` 文件
2. 加载镜像: \`docker load -i ${IMAGE_FILE}\`
3. 运行容器: \`docker run -d -p 8080:80 -e ALIBABA_API_KEY=your_key ai-travel-planner:latest\`

详细说明请查看项目文档。"
fi

if [ $? -ne 0 ]; then
    echo
    echo -e "${RED}❌ 发布失败${NC}"
    echo "可能的原因:"
    echo "1. 版本号已存在"
    echo "2. 网络连接问题"
    echo "3. 权限不足"
    echo
    echo "请检查错误信息或使用 GitHub Web 界面手动发布"
    exit 1
fi

echo
echo "========================================"
echo "   发布成功！"
echo "========================================"
echo
echo "Release 链接:"
gh release view "$VERSION" --web
echo
echo "下一步:"
echo "1. 访问 Release 页面确认文件已上传"
echo "2. 测试下载链接"
echo "3. 更新项目 README 中的下载链接"
echo

