#!/bin/bash

# Word Search Level Editor 本地启动脚本
# 用途: 启动本地开发服务器，带身份校验
# 使用: ./scripts/start-local.sh
# 登录: yanyi / yanyi123

echo "🚀 启动 Word Search Level Editor (本地开发模式)"
echo "================================================"

# 确保使用带认证的配置
if [ -f "config/auth-config.backup.json" ]; then
    # 恢复原认证配置
    cp config/auth-config.backup.json config/auth-config.json
    echo "🔐 已恢复带身份校验的认证配置"
elif [ ! -f "config/auth-config.json" ]; then
    echo "❌ 未找到认证配置文件，请检查配置"
    exit 1
else
    echo "🔐 使用现有认证配置（带身份校验）"
fi

# 加载本地环境配置
if [ -f "config/local-config.sh" ]; then
    source config/local-config.sh
    echo "✅ 已加载本地环境配置"
else
    echo "⚠️  未找到本地环境配置，使用默认配置"
fi

echo ""
echo "🌐 启动服务器..."
echo "   本地访问: http://localhost:3000"
echo "   团队访问: http://$(ipconfig getifaddr en0 2>/dev/null || echo "获取IP失败"):3000"
echo ""
echo "🔐 注意: 当前启用身份校验，需要登录后才能使用"
echo "   默认管理员账户: yanyi / yanyi123"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
node server/server.js
