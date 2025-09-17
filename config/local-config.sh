#!/bin/bash

# Word Search Level Editor 本地开发环境配置
# 使用方法: source local-config.sh && node server.js

echo "🏠 设置本地开发环境变量..."

# 基础配置
export NODE_ENV=development
export PORT=3000

# 本地数据目录配置（您的实际本地路径）
export LEVELS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/levels"
export CONFIGS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/configs"
export DICTIONARIES_DIR="/Users/yan/Desktop/word_search_level_editor"

# 可选配置
export MAX_FILE_SIZE="50mb"
export UPLOAD_DIR="/Users/yan/Desktop/word_search_level_editor/uploads"

echo "✅ 本地环境变量配置完成:"
echo "   NODE_ENV = $NODE_ENV"
echo "   PORT = $PORT"
echo "   LEVELS_DIR = $LEVELS_DIR"
echo "   CONFIGS_DIR = $CONFIGS_DIR"
echo "   DICTIONARIES_DIR = $DICTIONARIES_DIR"

# 检查本地目录是否存在
echo ""
echo "🔍 检查本地目录状态:"

if [ -d "$LEVELS_DIR" ]; then
    LEVEL_COUNT=$(find "$LEVELS_DIR" -name "*.json" 2>/dev/null | wc -l)
    echo "   ✅ LEVELS_DIR 存在，包含 $LEVEL_COUNT 个关卡文件"
else
    echo "   ❌ LEVELS_DIR 不存在: $LEVELS_DIR"
    echo "   💡 请检查路径是否正确"
fi

if [ -d "$CONFIGS_DIR" ]; then
    CONFIG_COUNT=$(find "$CONFIGS_DIR" -name "*.json" 2>/dev/null | wc -l)
    echo "   ✅ CONFIGS_DIR 存在，包含 $CONFIG_COUNT 个配置文件"
else
    echo "   ❌ CONFIGS_DIR 不存在: $CONFIGS_DIR"
    echo "   💡 请检查路径是否正确"
fi

if [ -d "$DICTIONARIES_DIR" ]; then
    echo "   ✅ DICTIONARIES_DIR 存在"
    if [ -f "$DICTIONARIES_DIR/BNC_COCA.csv" ]; then
        echo "   ✅ 找到 BNC_COCA.csv"
    else
        echo "   ⚠️  未找到 BNC_COCA.csv"
    fi
    if [ -f "$DICTIONARIES_DIR/dictionary.txt" ]; then
        echo "   ✅ 找到 dictionary.txt"
    else
        echo "   ⚠️  未找到 dictionary.txt"
    fi
else
    echo "   ❌ DICTIONARIES_DIR 不存在: $DICTIONARIES_DIR"
fi

echo ""
echo "💡 本地开发使用方法:"
echo "   source local-config.sh && node server.js"
echo ""
echo "🚀 服务器部署使用方法:"
echo "   source server-config.sh && node server.js"
