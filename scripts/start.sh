#!/bin/bash

# Word Search Level Editor 启动选择脚本

echo "🚀 Word Search Level Editor 启动选择"
echo "====================================="
echo ""
echo "请选择启动模式:"
echo ""
echo "1) 🔓 无认证模式 (直接显示所有关卡，适合快速测试)"
echo "2) 🔐 认证模式 (需要登录，完整功能体验)"
echo "3) 🔒 恢复认证配置"
echo "4) ❌ 退出"
echo ""

while true; do
    read -p "请输入选择 (1-4): " choice
    case $choice in
        1)
            echo ""
            echo "🔓 启动无认证模式..."
            ./start-local.sh
            break
            ;;
        2)
            echo ""
            echo "🔐 启动认证模式..."
            ./start-local-auth.sh
            break
            ;;
        3)
            echo ""
            ./restore-auth.sh
            echo ""
            echo "配置已恢复，请重新选择启动模式"
            echo ""
            ;;
        4)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo "❌ 无效选择，请输入 1-4"
            ;;
    esac
done

