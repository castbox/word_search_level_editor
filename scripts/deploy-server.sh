#!/bin/bash

# Word Search Level Editor 服务器部署脚本
# 用于在公司服务器上部署关卡编辑器

echo "🚀 Word Search Level Editor 服务器部署脚本"
echo "=================================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js (https://nodejs.org/)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 创建生产环境配置
echo "📝 配置生产环境..."

# 复制服务器包配置
if [ -f "package-server.json" ]; then
    cp package-server.json package.json
    echo "✅ 服务器包配置已设置"
else
    echo "❌ 未找到 package-server.json 文件"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p levels
mkdir -p uploads
mkdir -p logs

# 设置权限
chmod 755 levels
chmod 755 uploads
chmod 755 logs

echo "✅ 目录创建完成"

# 检查关键文件
echo "🔍 检查关键文件..."

required_files=(
    "server.js"
    "auth.js" 
    "auth-config.json"
    "public/index.html"
    "public/src/scripts/app.js"
    "public/src/scripts/navigation.js"
    "public/src/scripts/webapi.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ 缺少文件: $file"
        exit 1
    fi
done

# 创建启动脚本
echo "📜 创建启动脚本..."

cat > start-production.sh << 'EOF'
#!/bin/bash

# 生产环境启动脚本
export NODE_ENV=production
export PORT=${PORT:-3000}

echo "🚀 启动 Word Search Level Editor 服务器..."
echo "环境: $NODE_ENV"
echo "端口: $PORT"

# 启动服务器
node server.js

EOF

chmod +x start-production.sh

# 创建systemd服务文件（可选）
echo "⚙️ 创建系统服务配置..."

cat > word-search-editor.service << EOF
[Unit]
Description=Word Search Level Editor Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$(which node) server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 创建nginx配置示例
echo "🌐 创建Nginx配置示例..."

cat > nginx-config-example.conf << EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或IP

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 主应用代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 创建PM2配置（推荐）
echo "⚡ 创建PM2配置..."

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'word-search-editor',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/access.log',
    log_file: 'logs/combined.log',
    time: true
  }]
}
EOF

echo ""
echo "🎉 部署准备完成！"
echo "=================================================="
echo ""
echo "📋 部署选项："
echo ""
echo "方式1: 直接启动（开发/测试）"
echo "   ./start-production.sh"
echo ""
echo "方式2: 使用PM2（推荐生产环境）"
echo "   npm install -g pm2"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "方式3: 系统服务（Linux）"
echo "   sudo cp word-search-editor.service /etc/systemd/system/"
echo "   sudo systemctl enable word-search-editor"
echo "   sudo systemctl start word-search-editor"
echo ""
echo "🌐 Nginx反向代理（可选）"
echo "   参考 nginx-config-example.conf 文件"
echo ""
echo "🔗 访问地址："
echo "   http://服务器IP:3000"
echo "   或配置域名后: http://your-domain.com"
echo ""
echo "👥 默认管理员账号："
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "⚠️  安全提醒："
echo "   1. 修改默认管理员密码"
echo "   2. 配置防火墙规则"
echo "   3. 定期备份 levels/ 目录"
echo ""
