#!/bin/bash

# 恢复原认证配置脚本

echo "🔒 恢复认证配置..."

if [ -f "auth-config.backup.json" ]; then
    cp auth-config.backup.json auth-config.json
    echo "✅ 已恢复原认证配置"
    echo ""
    echo "📋 当前用户账号:"
    echo "   🎯 管理员: yanyi / yanyi123 (可查看所有关卡)"
    echo "   👤 用户1: zehao / zehao123"
    echo "   👤 用户2: hongkun / hongkun123"
    echo "   👤 用户3: fangge / fangge123"
    echo ""
    echo "🚀 启动带认证的服务器:"
    echo "   ./start-local-auth.sh"
    echo ""
    echo "🔓 启动无认证的服务器:"
    echo "   ./start-local.sh"
else
    echo "❌ 未找到备份文件 auth-config.backup.json"
    echo ""
    echo "💡 如果您想使用认证功能，当前配置应该已经是认证版本"
    echo "   可以直接运行: ./start-local-auth.sh"
fi
