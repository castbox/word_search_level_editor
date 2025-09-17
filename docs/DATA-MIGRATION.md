# 📦 数据迁移指南

## 🎯 问题说明

您的Word Search关卡编辑器目前使用本地路径存储数据，部署到服务器需要解决两个关键问题：

1. **路径配置问题**: 代码中硬编码了本地路径
2. **数据迁移问题**: 需要将本地已创建的关卡和配置迁移到服务器

## ✅ 解决方案

我已经为您准备了完整的解决方案：

### 1. 路径配置已修复 ✅

**修改内容:**
- `server.js` 中的硬编码路径已改为环境变量配置
- 支持灵活的目录配置，适应不同服务器环境

**修改前:**
```javascript
const LEVELS_DIR = '/Users/yan/Library/Application Support/word_search_level_editor/levels';
const CONFIGS_DIR = '/Users/yan/Library/Application Support/word_search_level_editor/configs';
```

**修改后:**
```javascript
const LEVELS_DIR = process.env.LEVELS_DIR || path.join(__dirname, 'levels');
const CONFIGS_DIR = process.env.CONFIGS_DIR || path.join(__dirname, 'configs');
```

### 2. 数据迁移脚本已创建 ✅

创建了以下脚本帮助您迁移数据：

- `backup-local-data.sh` - 备份本地数据
- `migrate-data.sh` - 一键迁移到服务器

## 🚀 迁移步骤

### 步骤1: 备份本地数据

```bash
# 在项目目录下运行
./backup-local-data.sh
```

这将备份您的：
- 关卡数据 (`/Users/yan/Library/Application Support/word_search_level_editor/levels/`)
- 配置数据 (`/Users/yan/Library/Application Support/word_search_level_editor/configs/`)
- 词典文件 (`BNC_COCA.csv`, `dictionary.txt`)
- 用户配置 (`auth-config.json`)

### 步骤2: 一键迁移到服务器

```bash
# 语法: ./migrate-data.sh <服务器用户@IP> <服务器项目路径>
./migrate-data.sh root@192.168.1.100 /opt/word_search_level_editor
```

**迁移脚本会自动:**
1. 上传项目代码到服务器
2. 迁移您的关卡数据
3. 迁移配置文件
4. 配置服务器环境
5. 安装依赖包
6. 创建启动脚本

### 步骤3: 启动服务器

```bash
# 登录服务器
ssh root@192.168.1.100

# 进入项目目录
cd /opt/word_search_level_editor

# 启动服务
./start-server.sh
```

## 📁 数据目录结构

**本地数据位置:**
```
/Users/yan/Library/Application Support/word_search_level_editor/
├── levels/          # 您创建的关卡文件
└── configs/         # 配置文件（如lv1_500.json）
```

**服务器数据位置:**
```
/opt/word_search_level_editor/
├── levels/          # 迁移后的关卡数据
├── configs/         # 迁移后的配置数据
├── uploads/         # 文件上传目录
├── logs/           # 日志文件
├── BNC_COCA.csv    # 词频数据
├── dictionary.txt  # 词典数据
└── auth-config.json # 用户认证配置
```

## 🔧 手动迁移（高级用户）

如果您需要手动控制迁移过程：

### 1. 手动上传项目代码

```bash
# 使用rsync上传（推荐）
rsync -av --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    word_search_level_editor/ \
    user@server:/opt/word_search_level_editor/
```

### 2. 手动迁移数据

```bash
# 上传关卡数据
scp -r "/Users/yan/Library/Application Support/word_search_level_editor/levels/" \
    user@server:/opt/word_search_level_editor/levels/

# 上传配置数据
scp -r "/Users/yan/Library/Application Support/word_search_level_editor/configs/" \
    user@server:/opt/word_search_level_editor/configs/
```

### 3. 配置服务器环境

在服务器上创建环境变量文件：

```bash
# 创建 server-env.sh
cat > server-env.sh << 'EOF'
export NODE_ENV=production
export PORT=3000
export LEVELS_DIR=/opt/word_search_level_editor/levels
export CONFIGS_DIR=/opt/word_search_level_editor/configs
export DICTIONARIES_DIR=/opt/word_search_level_editor
EOF

# 设置权限
chmod +x server-env.sh
```

### 4. 安装依赖并启动

```bash
# 复制服务器包配置
cp package-server.json package.json

# 安装依赖
npm install --production

# 启动服务
source ./server-env.sh && node server.js
```

## 🔍 验证迁移结果

### 1. 检查数据完整性

```bash
# 检查关卡文件数量
ls -la levels/*.json | wc -l

# 检查配置文件
ls -la configs/

# 检查词典文件
ls -la BNC_COCA.csv dictionary.txt
```

### 2. 测试功能

1. 访问 `http://服务器IP:3000`
2. 登录管理员账号
3. 检查关卡列表是否显示您的关卡
4. 尝试编辑和保存关卡
5. 测试词频功能

## ⚠️ 注意事项

### 数据安全
- ✅ 迁移前已自动备份本地数据
- ✅ 原始数据不会被删除
- ✅ 可以随时回滚到本地版本

### 权限设置
- 确保服务器目录有正确的读写权限
- 建议使用专门的用户运行服务，而不是root

### 网络配置
- 确保服务器防火墙开放3000端口
- 如需域名访问，配置DNS解析

## 🆘 故障排除

### 迁移失败
```bash
# 检查SSH连接
ssh user@server

# 检查磁盘空间
df -h

# 检查权限
ls -la /opt/word_search_level_editor/
```

### 服务启动失败
```bash
# 检查环境变量
source ./server-env.sh && env | grep -E "(LEVELS_DIR|CONFIGS_DIR)"

# 检查目录是否存在
ls -la levels/ configs/

# 查看详细错误
DEBUG=* node server.js
```

### 数据丢失
```bash
# 从备份恢复
cp -r backup_*/levels/* levels/
cp -r backup_*/configs/* configs/
```

## 📞 技术支持

如果遇到问题，请提供：
1. 迁移脚本的输出日志
2. 服务器错误信息
3. 本地数据目录结构截图
4. 服务器环境信息

## 🎉 迁移完成

迁移成功后，您的团队就可以：
- 通过浏览器访问 `http://服务器IP:3000`
- 使用所有原有的关卡数据
- 继续编辑和创建新关卡
- 享受多人协作的便利

**恭喜！您的Word Search关卡编辑器已成功部署到服务器！** 🎮✨
