#!/bin/bash

# Word Search Level Editor 统一启动脚本

echo "🚀 Word Search Level Editor 启动器"
echo "=================================="
echo ""
echo "请选择启动方式:"
echo ""
echo "1) 🌐 启动Web服务器 (推荐)"
echo "2) 📱 启动Electron桌面版"
echo "3) ❌ 退出"
echo ""

while true; do
    read -p "请输入选择 (1-3): " choice
    case $choice in
        1)
            echo ""
            echo "🌐 启动Web服务器..."
            ./scripts/start-server.sh
            break
            ;;
        2)
            echo ""
            echo "📱 启动Electron桌面版..."
            if [ -f "app/electron/main.js" ]; then
                cd app/electron
                node main.js
            else
                echo "❌ 未找到Electron主文件"
            fi
            break
            ;;
        3)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo "❌ 无效选择，请输入 1-3"
            ;;
    esac
done
