#!/bin/bash

# Word Search Level Editor 本地数据备份脚本
# 在迁移前备份您的本地数据

echo "💾 Word Search Level Editor 数据备份脚本"
echo "=========================================="

# 本地数据路径
LOCAL_LEVELS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/levels"
LOCAL_CONFIGS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/configs"

# 备份目录
BACKUP_DIR="$(pwd)/backup_$(date +%Y%m%d_%H%M%S)"

echo "📍 备份配置："
echo "   关卡数据源: $LOCAL_LEVELS_DIR"
echo "   配置数据源: $LOCAL_CONFIGS_DIR"
echo "   备份目标: $BACKUP_DIR"
echo ""

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份关卡数据
if [ -d "$LOCAL_LEVELS_DIR" ]; then
    echo "📋 备份关卡数据..."
    cp -r "$LOCAL_LEVELS_DIR" "$BACKUP_DIR/levels"
    LEVELS_COUNT=$(find "$LOCAL_LEVELS_DIR" -name "*.json" | wc -l)
    echo "✅ 已备份 $LEVELS_COUNT 个关卡文件"
else
    echo "⚠️  关卡目录不存在，跳过备份"
fi

# 备份配置数据
if [ -d "$LOCAL_CONFIGS_DIR" ]; then
    echo "⚙️  备份配置数据..."
    cp -r "$LOCAL_CONFIGS_DIR" "$BACKUP_DIR/configs"
    CONFIGS_COUNT=$(find "$LOCAL_CONFIGS_DIR" -name "*.json" | wc -l)
    echo "✅ 已备份 $CONFIGS_COUNT 个配置文件"
else
    echo "⚠️  配置目录不存在，跳过备份"
fi

# 备份项目中的词典文件
echo "📚 备份词典文件..."
if [ -f "BNC_COCA.csv" ]; then
    cp "BNC_COCA.csv" "$BACKUP_DIR/"
    echo "✅ 已备份 BNC_COCA.csv"
fi

if [ -f "dictionary.txt" ]; then
    cp "dictionary.txt" "$BACKUP_DIR/"
    echo "✅ 已备份 dictionary.txt"
fi

# 备份认证配置
if [ -f "auth-config.json" ]; then
    cp "auth-config.json" "$BACKUP_DIR/"
    echo "✅ 已备份用户认证配置"
fi

# 创建备份说明文件
cat > "$BACKUP_DIR/README.txt" << EOF
Word Search Level Editor 数据备份
备份时间: $(date)
备份内容:
- levels/: 关卡数据文件
- configs/: 配置数据文件
- BNC_COCA.csv: 词频数据文件（如果存在）
- dictionary.txt: 词典数据文件（如果存在）
- auth-config.json: 用户认证配置（如果存在）

恢复方法:
1. 将相应文件复制回原位置
2. 或在服务器部署时使用这些备份文件
EOF

echo ""
echo "🎉 备份完成！"
echo "=========================================="
echo "📁 备份位置: $BACKUP_DIR"
echo ""
echo "📋 备份内容:"
ls -la "$BACKUP_DIR"
echo ""
echo "💡 提示:"
echo "   - 请妥善保存此备份"
echo "   - 可以使用 migrate-data.sh 脚本将数据迁移到服务器"
echo "   - 或手动将备份文件复制到服务器对应目录"
