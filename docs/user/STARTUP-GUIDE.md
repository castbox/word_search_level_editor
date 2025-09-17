# 🚀 启动指南

## 🎯 问题解决

您遇到的"暂无保存的关卡"问题是因为环境变量配置错误。现在已经修复！

## 📋 启动脚本说明

### 🏠 本地开发（您当前需要的）

**使用本地数据，115个关卡文件：**
```bash
./start-local.sh
```

或者手动：
```bash
source local-config.sh && node server.js
```

### 🚀 服务器部署

**部署到生产服务器时使用：**
```bash
source server-config.sh && node server.js
```

## 🔧 配置文件对比

### `local-config.sh` - 本地开发配置
```bash
LEVELS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/levels"
CONFIGS_DIR="/Users/yan/Library/Application Support/word_search_level_editor/configs"
DICTIONARIES_DIR="/Users/yan/Desktop/word_search_level_editor"
```
- ✅ 指向您本地的115个关卡文件
- ✅ 用于本地测试和开发

### `server-config.sh` - 服务器部署配置
```bash
LEVELS_DIR="/opt/word_search_level_editor/levels"
CONFIGS_DIR="/opt/word_search_level_editor/configs"
DICTIONARIES_DIR="/opt/word_search_level_editor"
```
- ✅ 指向服务器路径
- ✅ 用于生产环境部署

## 🎮 现在可以正常使用了

1. **运行本地启动脚本：**
```bash
./start-local.sh
```

2. **打开浏览器访问：**
- `http://localhost:3000`

3. **应该能看到您的115个关卡！**

## 🔍 验证数据

启动前可以检查数据状态：
```bash
source local-config.sh
# 会显示找到115个关卡文件和1个配置文件
```

## 📞 如果还有问题

1. **检查环境变量：**
```bash
source local-config.sh
echo $LEVELS_DIR
```

2. **检查数据文件：**
```bash
ls -la "/Users/yan/Library/Application Support/word_search_level_editor/levels/" | wc -l
```

3. **重启服务器：**
```bash
# 按 Ctrl+C 停止服务器，然后重新运行
./start-local.sh
```

## 🎉 总结

- ✅ **问题已修复** - 路径配置错误导致找不到关卡
- ✅ **本地开发** - 使用 `./start-local.sh` 
- ✅ **服务器部署** - 使用 `source server-config.sh && node server.js`
- ✅ **数据安全** - 您的115个关卡文件完好无损

现在启动服务器应该能看到您的所有关卡了！
