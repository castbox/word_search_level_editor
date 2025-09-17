#!/bin/bash

# Word Search Level Editor 服务器环境配置
# 使用方法: source server-config.sh && node server.js

echo "🔧 设置 Word Search Level Editor 环境变量..."

# 基础配置
export NODE_ENV=production
export PORT=3000

# 数据目录配置（根据您的服务器路径修改）
export LEVELS_DIR="/opt/word_search_level_editor/levels"
export CONFIGS_DIR="/opt/word_search_level_editor/configs"
export DICTIONARIES_DIR="/opt/word_search_level_editor"

# 可选配置
export MAX_FILE_SIZE="50mb"
export UPLOAD_DIR="/opt/word_search_level_editor/uploads"

echo "✅ 环境变量配置完成:"
echo "   NODE_ENV = $NODE_ENV"
echo "   PORT = $PORT"
echo "   LEVELS_DIR = $LEVELS_DIR"
echo "   CONFIGS_DIR = $CONFIGS_DIR"
echo "   DICTIONARIES_DIR = $DICTIONARIES_DIR"

# 检查目录是否存在
echo ""
echo "🔍 检查目录状态:"

if [ -d "$LEVELS_DIR" ]; then
    LEVEL_COUNT=$(find "$LEVELS_DIR" -name "*.json" 2>/dev/null | wc -l)
    echo "   ✅ LEVELS_DIR 存在，包含 $LEVEL_COUNT 个关卡文件"
else
    echo "   ⚠️  LEVELS_DIR 不存在，将使用默认目录"
fi

if [ -d "$CONFIGS_DIR" ]; then
    CONFIG_COUNT=$(find "$CONFIGS_DIR" -name "*.json" 2>/dev/null | wc -l)
    echo "   ✅ CONFIGS_DIR 存在，包含 $CONFIG_COUNT 个配置文件"
else
    echo "   ⚠️  CONFIGS_DIR 不存在，将使用默认目录"
fi

if [ -d "$DICTIONARIES_DIR" ]; then
    echo "   ✅ DICTIONARIES_DIR 存在"
    if [ -f "$DICTIONARIES_DIR/BNC_COCA.csv" ]; then
        echo "   ✅ 找到 BNC_COCA.csv"
    fi
    if [ -f "$DICTIONARIES_DIR/dictionary.txt" ]; then
        echo "   ✅ 找到 dictionary.txt"
    fi
else
    echo "   ⚠️  DICTIONARIES_DIR 不存在，将使用默认目录"
fi

echo ""
echo "💡 使用方法:"
echo "   source server-config.sh && node server.js"
echo "   或者:"
echo "   source server-config.sh"
echo "   node server.js"
