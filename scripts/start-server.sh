#!/bin/bash

echo "🚀 Word Search Level Editor - 启动网页服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    cp package-server.json package.json
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 确保使用服务器版本的package.json
cp package-server.json package.json

# 加载本地环境配置（如果存在）
if [ -f "config/local-config.sh" ]; then
    echo "🔧 加载本地环境配置: config/local-config.sh"
    # shellcheck disable=SC1091
    source config/local-config.sh
else
    echo "⚠️  未找到本地配置，使用默认配置"
fi

echo "🔄 启动服务器..."
echo ""

# 启动服务器（新路径）
node server/server.js
