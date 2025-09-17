#!/bin/bash

# Word Search Level Editor 本地启动脚本（带认证）

echo "🔐 启动 Word Search Level Editor (本地开发模式 - 带用户认证)"
echo "============================================================"

# 恢复原认证配置（如果有备份的话）
if [ -f "auth-config.backup.json" ]; then
    cp auth-config.backup.json auth-config.json
    echo "🔒 已恢复用户认证配置"
else
    echo "🔒 使用当前认证配置"
fi

# 加载本地环境配置
source ./local-config.sh

echo ""
echo "👥 用户账号信息:"
echo "   🎯 管理员: yanyi / yanyi123 (可查看所有关卡)"
echo "   👤 用户1: zehao / zehao123"
echo "   👤 用户2: hongkun / hongkun123" 
echo "   👤 用户3: fangge / fangge123"
echo ""
echo "🌐 启动服务器..."
echo "   本地访问: http://localhost:3000"
echo "   团队访问: http://$(ipconfig getifaddr en0 2>/dev/null || echo "获取IP失败"):3000"
echo ""
echo "📋 使用说明:"
echo "   1. 打开浏览器访问上述地址"
echo "   2. 系统会自动跳转到登录页面"
echo "   3. 使用上述账号登录"
echo "   4. 管理员可查看所有115个关卡"
echo "   5. 普通用户只能查看自己创建的关卡"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
node server.js

