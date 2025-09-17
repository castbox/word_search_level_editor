#!/bin/bash

# Word Search Level Editor 目录重组脚本

echo "🗂️  Word Search Level Editor 目录重组"
echo "====================================="

# 创建新的目录结构
echo "📁 创建新目录结构..."

# 1. 核心应用目录
mkdir -p app/{electron,web}
mkdir -p app/shared/{scripts,styles}

# 2. 服务器相关
mkdir -p server/{config,scripts}

# 3. 部署相关
mkdir -p deployment/{scripts,docker,docs}

# 4. 开发工具
mkdir -p tools/{scripts,configs}

# 5. 数据目录
mkdir -p data/{dictionaries,sample-levels}

# 6. 文档目录
mkdir -p docs/{user,dev,deployment}

echo "✅ 目录结构创建完成"

echo ""
echo "🔄 开始文件重组..."

# 移动Electron应用文件
echo "📱 重组Electron应用文件..."
mv main.js app/electron/ 2>/dev/null || echo "   - main.js 不存在，跳过"
mv preload.js app/electron/ 2>/dev/null || echo "   - preload.js 不存在，跳过"  
mv level_editor.js app/electron/ 2>/dev/null || echo "   - level_editor.js 不存在，跳过"
mv index.html app/electron/ 2>/dev/null || echo "   - index.html 不存在，跳过"

# 移动Web应用文件
echo "🌐 重组Web应用文件..."
mv public app/web/ 2>/dev/null || echo "   - public 目录不存在，跳过"
mv server.js server/ 2>/dev/null || echo "   - server.js 不存在，跳过"
mv auth.js server/ 2>/dev/null || echo "   - auth.js 不存在，跳过"

# 移动共享脚本和样式
echo "📄 重组共享文件..."
if [ -d "src" ]; then
    cp -r src/* app/shared/ 2>/dev/null
    echo "   ✅ 复制src内容到共享目录"
fi

# 移动服务器配置文件
echo "⚙️  重组服务器配置..."
mv auth-config*.json server/config/ 2>/dev/null || echo "   - 认证配置文件处理完成"
mv load-env.js server/config/ 2>/dev/null || echo "   - load-env.js 不存在，跳过"

# 移动启动脚本
echo "🚀 重组启动脚本..."
mv start*.sh server/scripts/ 2>/dev/null || echo "   - 启动脚本处理完成"
mv start*.bat server/scripts/ 2>/dev/null || echo "   - Windows启动脚本处理完成"
mv start-with-ip.js server/scripts/ 2>/dev/null || echo "   - start-with-ip.js 不存在，跳过"

# 移动部署相关文件
echo "📦 重组部署文件..."
mv deploy-server.sh deployment/scripts/ 2>/dev/null || echo "   - deploy-server.sh 不存在，跳过"
mv migrate-data.sh deployment/scripts/ 2>/dev/null || echo "   - migrate-data.sh 不存在，跳过"
mv backup-local-data.sh deployment/scripts/ 2>/dev/null || echo "   - backup-local-data.sh 不存在，跳过"
mv restore-auth.sh deployment/scripts/ 2>/dev/null || echo "   - restore-auth.sh 不存在，跳过"

# 移动Docker文件
echo "🐳 重组Docker文件..."
mv Dockerfile deployment/docker/ 2>/dev/null || echo "   - Dockerfile 不存在，跳过"
mv docker-compose.yml deployment/docker/ 2>/dev/null || echo "   - docker-compose.yml 不存在，跳过"
mv .dockerignore deployment/docker/ 2>/dev/null || echo "   - .dockerignore 不存在，跳过"

# 移动配置文件
echo "🔧 重组配置文件..."
mv *config*.sh tools/configs/ 2>/dev/null || echo "   - 配置脚本处理完成"
mv env.example tools/configs/ 2>/dev/null || echo "   - env.example 不存在，跳过"
mv server.env.example tools/configs/ 2>/dev/null || echo "   - server.env.example 不存在，跳过"

# 移动包配置文件到根目录（保持在根目录）
echo "📋 整理包配置文件..."
# package.json, package-lock.json 保持在根目录

# 移动数据文件
echo "📚 重组数据文件..."
mv BNC_COCA.csv data/dictionaries/ 2>/dev/null || echo "   - BNC_COCA.csv 不存在，跳过"
mv dictionary.txt data/dictionaries/ 2>/dev/null || echo "   - dictionary.txt 不存在，跳过"
if [ -d "levels" ]; then
    mv levels data/sample-levels/ 2>/dev/null || echo "   - levels 目录处理完成"
fi

# 移动文档
echo "📖 重组文档文件..."
mv README*.md docs/user/ 2>/dev/null || echo "   - README文件处理完成"
mv *DEPLOYMENT*.md docs/deployment/ 2>/dev/null || echo "   - 部署文档处理完成"
mv *STARTUP*.md docs/user/ 2>/dev/null || echo "   - 启动文档处理完成"
mv *MIGRATION*.md docs/deployment/ 2>/dev/null || echo "   - 迁移文档处理完成"
mv TEAM-ACCESS.md docs/user/ 2>/dev/null || echo "   - 团队访问文档处理完成"
mv ENVIRONMENT-CONFIG.md docs/dev/ 2>/dev/null || echo "   - 环境配置文档处理完成"
mv QUICK-DEPLOY.md docs/deployment/ 2>/dev/null || echo "   - 快速部署文档处理完成"

# 清理空目录和临时文件
echo "🧹 清理临时文件..."
rm -rf src 2>/dev/null || echo "   - src 目录已清理"
rm -rf word_count 2>/dev/null || echo "   - word_count 目录已清理"
rm -rf word_search_level_editor 2>/dev/null || echo "   - word_search_level_editor 目录已清理"

# 保留的目录和文件
echo "📋 保留的重要目录:"
echo "   - node_modules/ (依赖包)"
echo "   - build/ (构建输出)"
echo "   - dist/ (分发包)" 
echo "   - uploads/ (上传目录)"

echo ""
echo "🎉 目录重组完成！"
echo ""
echo "📁 新的目录结构:"
echo "├── app/                    # 应用代码"
echo "│   ├── electron/          # Electron应用"
echo "│   ├── web/               # Web应用"
echo "│   └── shared/            # 共享代码"
echo "├── server/                # 服务器代码"
echo "│   ├── config/            # 服务器配置"
echo "│   └── scripts/           # 启动脚本"
echo "├── deployment/            # 部署相关"
echo "│   ├── scripts/           # 部署脚本"
echo "│   ├── docker/            # Docker配置"
echo "│   └── docs/              # 部署文档"
echo "├── tools/                 # 开发工具"
echo "│   ├── scripts/           # 工具脚本"
echo "│   └── configs/           # 配置模板"
echo "├── data/                  # 数据文件"
echo "│   ├── dictionaries/      # 词典文件"
echo "│   └── sample-levels/     # 示例关卡"
echo "├── docs/                  # 文档"
echo "│   ├── user/              # 用户文档"
echo "│   ├── dev/               # 开发文档"
echo "│   └── deployment/        # 部署文档"
echo "└── [根目录保留]"
echo "    ├── package.json       # 项目配置"
echo "    ├── package-lock.json  # 依赖锁定"
echo "    ├── node_modules/      # 依赖包"
echo "    ├── build/             # 构建输出"
echo "    ├── dist/              # 分发包"
echo "    └── uploads/           # 上传目录"

