#!/bin/bash

# Word Search Level Editor 数据迁移脚本
# 将本地数据迁移到服务器

echo "🔄 Word Search Level Editor 数据迁移脚本"
echo "=============================================="

# 检查是否提供了服务器信息
if [ $# -lt 2 ]; then
    echo "使用方法: $0 <服务器用户@IP> <服务器项目路径>"
    echo "示例: $0 root@192.168.1.100 /opt/word_search_level_editor"
    exit 1
fi

SERVER_HOST="$1"
SERVER_PATH="$2"

# 本地数据路径
LOCAL_LEVELS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/levels"
LOCAL_CONFIGS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/configs"
LOCAL_PROJECT_DIR="/Users/yan/Desktop/word_search_level_editor"

echo "📍 迁移配置："
echo "   本地项目目录: $LOCAL_PROJECT_DIR"
echo "   本地关卡目录: $LOCAL_LEVELS_DIR"
echo "   本地配置目录: $LOCAL_CONFIGS_DIR"
echo "   服务器: $SERVER_HOST"
echo "   服务器路径: $SERVER_PATH"
echo ""

# 检查本地数据是否存在
echo "🔍 检查本地数据..."

if [ ! -d "$LOCAL_LEVELS_DIR" ]; then
    echo "⚠️  警告: 本地关卡目录不存在: $LOCAL_LEVELS_DIR"
    echo "   将跳过关卡数据迁移"
    SKIP_LEVELS=true
else
    LEVELS_COUNT=$(find "$LOCAL_LEVELS_DIR" -name "*.json" | wc -l)
    echo "✅ 找到 $LEVELS_COUNT 个关卡文件"
fi

if [ ! -d "$LOCAL_CONFIGS_DIR" ]; then
    echo "⚠️  警告: 本地配置目录不存在: $LOCAL_CONFIGS_DIR"
    echo "   将跳过配置数据迁移"
    SKIP_CONFIGS=true
else
    CONFIGS_COUNT=$(find "$LOCAL_CONFIGS_DIR" -name "*.json" | wc -l)
    echo "✅ 找到 $CONFIGS_COUNT 个配置文件"
fi

# 检查词典文件
DICT_FILES=()
if [ -f "$LOCAL_PROJECT_DIR/BNC_COCA.csv" ]; then
    DICT_FILES+=("BNC_COCA.csv")
    echo "✅ 找到词频文件: BNC_COCA.csv"
fi

if [ -f "$LOCAL_PROJECT_DIR/dictionary.txt" ]; then
    DICT_FILES+=("dictionary.txt")
    echo "✅ 找到词典文件: dictionary.txt"
fi

echo ""
read -p "📤 是否继续迁移数据到服务器? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 迁移已取消"
    exit 1
fi

# 开始迁移
echo "🚀 开始数据迁移..."

# 1. 创建服务器目录结构
echo "📁 创建服务器目录结构..."
ssh "$SERVER_HOST" "mkdir -p $SERVER_PATH/levels $SERVER_PATH/configs $SERVER_PATH/uploads $SERVER_PATH/logs"

if [ $? -ne 0 ]; then
    echo "❌ 无法连接到服务器或创建目录失败"
    exit 1
fi

echo "✅ 服务器目录创建成功"

# 2. 上传项目代码
echo "📦 上传项目代码..."
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'build' \
    --exclude 'uploads/*' \
    --exclude 'logs/*' \
    "$LOCAL_PROJECT_DIR/" "$SERVER_HOST:$SERVER_PATH/"

if [ $? -ne 0 ]; then
    echo "❌ 项目代码上传失败"
    exit 1
fi

echo "✅ 项目代码上传完成"

# 3. 上传关卡数据
if [ "$SKIP_LEVELS" != true ]; then
    echo "📋 上传关卡数据..."
    rsync -av --progress "$LOCAL_LEVELS_DIR/" "$SERVER_HOST:$SERVER_PATH/levels/"
    
    if [ $? -eq 0 ]; then
        echo "✅ 关卡数据上传完成 ($LEVELS_COUNT 个文件)"
    else
        echo "⚠️  关卡数据上传失败，但继续执行"
    fi
fi

# 4. 上传配置数据
if [ "$SKIP_CONFIGS" != true ]; then
    echo "⚙️  上传配置数据..."
    rsync -av --progress "$LOCAL_CONFIGS_DIR/" "$SERVER_HOST:$SERVER_PATH/configs/"
    
    if [ $? -eq 0 ]; then
        echo "✅ 配置数据上传完成 ($CONFIGS_COUNT 个文件)"
    else
        echo "⚠️  配置数据上传失败，但继续执行"
    fi
fi

# 5. 设置服务器环境
echo "🔧 配置服务器环境..."

# 创建环境变量配置文件
cat > /tmp/server-env.sh << EOF
#!/bin/bash
# Word Search Level Editor 服务器环境配置

export NODE_ENV=production
export PORT=3000
export LEVELS_DIR="$SERVER_PATH/levels"
export CONFIGS_DIR="$SERVER_PATH/configs"
export DICTIONARIES_DIR="$SERVER_PATH"

echo "✅ 环境变量已设置:"
echo "   LEVELS_DIR=\$LEVELS_DIR"
echo "   CONFIGS_DIR=\$CONFIGS_DIR"
echo "   DICTIONARIES_DIR=\$DICTIONARIES_DIR"
EOF

# 上传环境配置
scp /tmp/server-env.sh "$SERVER_HOST:$SERVER_PATH/"
rm /tmp/server-env.sh

# 在服务器上设置权限和安装依赖
ssh "$SERVER_HOST" << EOF
cd $SERVER_PATH

# 设置文件权限
chmod +x *.sh
chmod 755 levels configs uploads logs
chmod 600 auth-config.json 2>/dev/null || true

# 复制服务器包配置
if [ -f "package-server.json" ]; then
    cp package-server.json package.json
    echo "✅ 服务器包配置已设置"
fi

# 安装依赖
echo "📦 安装服务器依赖..."
npm install --production

echo "✅ 服务器环境配置完成"
EOF

if [ $? -ne 0 ]; then
    echo "⚠️  服务器环境配置可能有问题，请手动检查"
else
    echo "✅ 服务器环境配置成功"
fi

# 6. 创建启动脚本
echo "📜 创建服务器启动脚本..."

ssh "$SERVER_HOST" << EOF
cd $SERVER_PATH

cat > start-server.sh << 'SCRIPT_EOF'
#!/bin/bash

# 加载环境变量
source ./server-env.sh

# 启动服务器
echo "🚀 启动 Word Search Level Editor 服务器..."
echo "端口: \$PORT"
echo "关卡目录: \$LEVELS_DIR"
echo "配置目录: \$CONFIGS_DIR"

node server.js
SCRIPT_EOF

chmod +x start-server.sh
echo "✅ 启动脚本创建完成"
EOF

echo ""
echo "🎉 数据迁移完成！"
echo "=============================================="
echo ""
echo "📋 迁移总结:"
echo "   ✅ 项目代码已上传"
if [ "$SKIP_LEVELS" != true ]; then
    echo "   ✅ 关卡数据已迁移 ($LEVELS_COUNT 个文件)"
fi
if [ "$SKIP_CONFIGS" != true ]; then
    echo "   ✅ 配置数据已迁移 ($CONFIGS_COUNT 个文件)"
fi
echo "   ✅ 服务器环境已配置"
echo "   ✅ 启动脚本已创建"
echo ""
echo "🚀 下一步操作:"
echo "   1. 登录服务器: ssh $SERVER_HOST"
echo "   2. 进入项目目录: cd $SERVER_PATH"
echo "   3. 启动服务器: ./start-server.sh"
echo "   4. 访问测试: http://服务器IP:3000"
echo ""
echo "🔧 如需使用PM2管理进程:"
echo "   npm install -g pm2"
echo "   source ./server-env.sh && pm2 start ecosystem.config.js"
echo ""
echo "📞 如有问题，请检查服务器日志和网络配置"
