# 🔧 环境变量配置指南

## 💡 什么是环境变量？

这行代码：
```javascript
const LEVELS_DIR = process.env.LEVELS_DIR || path.join(__dirname, 'levels');
```

意思是：
1. **优先使用环境变量** `process.env.LEVELS_DIR` 的值
2. **如果环境变量不存在**，则使用默认值 `./levels`（项目目录下的levels文件夹）

## 🎯 配置方法

### 方式1: 使用配置脚本（推荐）

1. **修改配置脚本**
```bash
# 编辑 server-config.sh，修改路径为您的服务器路径
nano server-config.sh
```

2. **修改这些路径**
```bash
# 改为您的实际服务器路径
export LEVELS_DIR="/opt/word_search_level_editor/levels"
export CONFIGS_DIR="/opt/word_search_level_editor/configs"
export DICTIONARIES_DIR="/opt/word_search_level_editor"
```

3. **使用配置启动**
```bash
# 加载配置并启动服务器
source server-config.sh && node server.js
```

### 方式2: 命令行直接设置

```bash
# 一次性设置并启动
LEVELS_DIR="/your/server/path/levels" \
CONFIGS_DIR="/your/server/path/configs" \
DICTIONARIES_DIR="/your/server/path" \
node server.js
```

### 方式3: 使用 .env 文件

1. **修改 server.js 第一行**
```javascript
// 在 server.js 开头添加这一行
require('./load-env');

const express = require('express');
// ... 其他代码
```

2. **创建 .env 文件**
```bash
# 复制示例文件
cp env.example .env

# 编辑配置
nano .env
```

3. **修改 .env 内容**
```bash
# 修改为您的服务器路径
LEVELS_DIR=/opt/word_search_level_editor/levels
CONFIGS_DIR=/opt/word_search_level_editor/configs
DICTIONARIES_DIR=/opt/word_search_level_editor
```

4. **正常启动**
```bash
node server.js
```

### 方式4: 系统级环境变量

```bash
# 添加到 ~/.bashrc 或 ~/.profile
echo 'export LEVELS_DIR="/opt/word_search_level_editor/levels"' >> ~/.bashrc
echo 'export CONFIGS_DIR="/opt/word_search_level_editor/configs"' >> ~/.bashrc
echo 'export DICTIONARIES_DIR="/opt/word_search_level_editor"' >> ~/.bashrc

# 重新加载配置
source ~/.bashrc

# 启动服务器
node server.js
```

## 📍 路径配置示例

### 本地开发环境
```bash
# 使用您当前的本地路径
export LEVELS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/levels"
export CONFIGS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/configs"
export DICTIONARIES_DIR="/Users/yan/Desktop/word_search_level_editor"
```

### Linux服务器环境
```bash
# 标准Linux服务器路径
export LEVELS_DIR="/opt/word_search_level_editor/levels"
export CONFIGS_DIR="/opt/word_search_level_editor/configs"
export DICTIONARIES_DIR="/opt/word_search_level_editor"
```

### Docker环境
```bash
# Docker容器内路径
export LEVELS_DIR="/app/levels"
export CONFIGS_DIR="/app/configs"
export DICTIONARIES_DIR="/app"
```

## 🔍 验证配置

运行配置脚本查看状态：
```bash
source server-config.sh
```

**输出示例:**
```
🔧 设置 Word Search Level Editor 环境变量...
✅ 环境变量配置完成:
   NODE_ENV = production
   PORT = 3000
   LEVELS_DIR = /opt/word_search_level_editor/levels
   CONFIGS_DIR = /opt/word_search_level_editor/configs
   DICTIONARIES_DIR = /opt/word_search_level_editor

🔍 检查目录状态:
   ✅ LEVELS_DIR 存在，包含 115 个关卡文件
   ✅ CONFIGS_DIR 存在，包含 1 个配置文件
   ✅ DICTIONARIES_DIR 存在
   ✅ 找到 BNC_COCA.csv
   ✅ 找到 dictionary.txt
```

## 🚨 常见问题

### Q1: 环境变量没有生效？
```bash
# 检查环境变量是否设置
echo $LEVELS_DIR

# 在Node.js中检查
node -e "console.log('LEVELS_DIR:', process.env.LEVELS_DIR)"
```

### Q2: 路径不存在怎么办？
```bash
# 创建目录
mkdir -p /opt/word_search_level_editor/levels
mkdir -p /opt/word_search_level_editor/configs

# 检查权限
ls -la /opt/word_search_level_editor/
```

### Q3: 权限问题
```bash
# 设置正确权限
sudo chown -R $USER:$USER /opt/word_search_level_editor/
chmod 755 /opt/word_search_level_editor/levels
chmod 755 /opt/word_search_level_editor/configs
```

## 🎯 推荐配置流程

1. **选择配置方式** - 推荐使用 `server-config.sh`
2. **修改路径** - 根据您的服务器环境修改
3. **测试配置** - 运行 `source server-config.sh` 查看状态
4. **启动服务** - `source server-config.sh && node server.js`

## 💡 提示

- **开发环境**: 使用本地路径，方便调试
- **生产环境**: 使用服务器路径，数据集中管理
- **Docker环境**: 使用容器内路径，配合volume挂载

现在您知道如何配置这些环境变量了！
