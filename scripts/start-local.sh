#!/bin/bash

# Word Search Level Editor 本地启动脚本

echo "🚀 启动 Word Search Level Editor (本地开发模式)"
echo "================================================"

# 备份原认证配置
if [ -f "auth-config.json" ] && [ ! -f "auth-config.backup.json" ]; then
    cp auth-config.json auth-config.backup.json
    echo "📁 已备份原认证配置"
fi

# 使用本地无认证配置
cp auth-config-local.json auth-config.json
echo "🔓 使用本地无认证配置（测试模式）"

# 加载本地环境配置
source ./local-config.sh

echo ""
echo "🌐 启动服务器..."
echo "   本地访问: http://localhost:3000"
echo "   团队访问: http://$(ipconfig getifaddr en0 2>/dev/null || echo "获取IP失败"):3000"
echo ""
echo "⚠️  注意: 当前为无认证模式，仅用于本地测试"
echo "   部署到服务器时请使用有认证版本"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
node server.js
