# 🚀 本地启动指南

## 📋 启动脚本说明

现在有多种方式启动您的Word Search关卡编辑器：

### 🎯 方式1: 启动选择器（推荐）

```bash
./start.sh
```

会显示菜单让您选择：
- 🔓 无认证模式 - 直接显示所有115个关卡
- 🔐 认证模式 - 需要登录，完整功能体验
- 🔒 恢复认证配置
- ❌ 退出

### 🔓 方式2: 直接启动无认证模式

```bash
./start-local.sh
```

**特点:**
- ✅ 无需登录，直接显示所有关卡
- ✅ 适合快速测试和开发
- ✅ 自动使用本地数据路径

### 🔐 方式3: 直接启动认证模式

```bash
./start-local-auth.sh
```

**特点:**
- 🔒 需要用户登录
- 👥 支持多用户管理
- 🎯 完整的权限控制

## 👥 用户账号

### 管理员账号
- **用户名**: `yanyi`
- **密码**: `yanyi123`
- **权限**: 可以查看所有用户的关卡（包括您的115个关卡）
- **功能**: 创建、编辑、删除所有关卡

### 普通用户账号
- **用户1**: `zehao` / `zehao123`
- **用户2**: `hongkun` / `hongkun123`
- **用户3**: `fangge` / `fangge123`
- **权限**: 只能查看和编辑自己创建的关卡

## 🔄 配置管理

### 恢复认证配置
```bash
./restore-auth.sh
```

### 检查当前配置
```bash
# 查看认证状态
grep '"enabled"' auth-config.json

# 查看用户列表
grep '"username"' auth-config.json
```

## 📁 数据路径

所有启动方式都使用相同的本地数据路径：
- **关卡数据**: `/Users/yan/Library/Application Support/word_search_level_editor/levels` (115个文件)
- **配置数据**: `/Users/yan/Library/Application Support/word_search_level_editor/configs`
- **词典数据**: `/Users/yan/Desktop/word_search_level_editor`

## 🌐 访问地址

启动后访问：
- **本地**: http://localhost:3000
- **团队**: http://您的IP:3000

## 🎯 使用场景

### 🔓 无认证模式适用于:
- 快速测试功能
- 开发调试
- 单人使用
- 查看所有关卡数据

### 🔐 认证模式适用于:
- 团队协作
- 多用户环境
- 权限管理测试
- 生产环境模拟

## 🛠️ 故障排除

### 问题1: 看不到关卡
```bash
# 检查环境变量
source local-config.sh
echo $LEVELS_DIR

# 检查文件数量
ls "$LEVELS_DIR" | wc -l
```

### 问题2: 登录失败
- 检查用户名密码是否正确
- 确认认证配置是否正确加载

### 问题3: 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 PID
```

## 💡 推荐工作流程

### 开发测试时:
```bash
./start.sh
# 选择 1 (无认证模式)
```

### 功能验证时:
```bash
./start.sh  
# 选择 2 (认证模式)
# 使用 yanyi/yanyi123 登录测试
```

### 部署准备时:
```bash
./restore-auth.sh  # 确保认证配置正确
# 然后使用部署脚本
```

## 🎉 现在您可以：

1. **快速测试**: `./start-local.sh` 直接看到115个关卡
2. **完整体验**: `./start-local-auth.sh` 体验用户登录流程
3. **方便选择**: `./start.sh` 交互式选择启动模式

选择最适合您当前需求的启动方式！

