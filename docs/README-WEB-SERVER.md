# Word Search Level Editor - 网页服务器版本

## 🎯 项目简介

这是Word Search关卡编辑器的网页服务器版本，支持团队协作编辑关卡。服务器运行在您的本地电脑上，团队成员通过浏览器访问即可使用。

## 🚀 快速启动

### 方法1: 使用启动脚本（推荐）

**macOS/Linux:**
```bash
./start-server.sh
```

**Windows:**
```batch
start-server.bat
```

### 方法2: 手动启动

1. **安装依赖**
```bash
cp package-server.json package.json
npm install
```

2. **启动服务器**
```bash
node server.js
```

## 🌐 访问方式

服务器启动后会显示访问地址：

- **您本地访问**: http://localhost:3000
- **团队成员访问**: http://您的IP地址:3000

例如：`http://192.168.1.100:3000`

## 📁 目录结构

```
word_search_level_editor/
├── server.js                 # 服务器主文件
├── package-server.json       # 服务器依赖配置
├── start-server.sh          # macOS/Linux启动脚本
├── start-server.bat         # Windows启动脚本
├── public/                  # 网页前端文件
│   ├── index.html
│   └── src/
│       ├── scripts/
│       │   ├── webapi.js    # WebAPI适配器
│       │   ├── app.js
│       │   ├── navigation.js
│       │   ├── grid.js
│       │   ├── wordList.js
│       │   └── wordFrequency.js
│       └── styles/
│           └── main.css
├── levels/                  # 关卡数据目录
│   └── *.json
├── BNC_COCA.csv            # 词频数据（可选）
└── dictionary.txt          # 词典数据（可选）
```

## 🔧 功能特性

### ✅ 已支持的功能
- 🎮 **关卡编辑**: 完整的网格编辑功能
- 💾 **关卡保存**: 保存到服务器本地文件系统
- 📋 **关卡管理**: 查看、编辑、删除关卡
- 📥 **批量导入**: 支持JSON格式的关卡批量导入
- 📤 **关卡导出**: 生成配置文件并下载
- 👥 **多人访问**: 支持团队成员同时使用
- 🔄 **实时同步**: 所有操作实时同步到服务器

### 🎯 网页版特有优势
- 📱 **跨平台**: 手机、平板、电脑都能访问
- 🚀 **零安装**: 团队成员只需要浏览器
- 🔄 **实时协作**: 多人可以同时编辑不同关卡
- 💰 **零成本**: 不需要云服务器
- 🔒 **数据安全**: 数据完全在您的本地

## 🛠️ API接口

服务器提供以下API接口：

- `GET /api/levels` - 获取所有关卡
- `POST /api/levels` - 保存关卡
- `DELETE /api/levels/:filename` - 删除关卡
- `POST /api/levels/batch-import` - 批量导入关卡
- `GET /api/dictionary/:type` - 获取词典数据
- `POST /api/levels/generate` - 生成关卡配置文件
- `GET /health` - 健康检查

## 🔧 网络配置

### 防火墙设置
确保端口3000在防火墙中开放：

**macOS:**
```bash
# 临时开放（重启后失效）
sudo pfctl -f /etc/pf.conf
```

**Windows:**
```batch
# 在Windows防火墙中添加端口3000的入站规则
netsh advfirewall firewall add rule name="Word Search Server" dir=in action=allow protocol=TCP localport=3000
```

### 路由器设置
如果团队成员在不同网络，可能需要配置路由器端口转发。

## 🐛 故障排除

### 常见问题

1. **无法启动服务器**
   - 检查Node.js是否正确安装
   - 检查端口3000是否被占用
   - 运行 `npm install` 重新安装依赖

2. **团队成员无法访问**
   - 检查防火墙设置
   - 确认在同一网络环境
   - 尝试使用IP地址而非localhost

3. **关卡保存失败**
   - 检查levels目录权限
   - 查看服务器控制台错误信息

### 查看日志
服务器运行时会在控制台显示详细日志，包括：
- 请求处理情况
- 错误信息
- 文件操作状态

## 🔄 数据迁移

### 从Electron版本迁移
1. 将现有的 `levels/` 目录复制到服务器项目根目录
2. 将 `BNC_COCA.csv` 和 `dictionary.txt` 复制到项目根目录
3. 启动服务器即可

### 备份数据
建议定期备份 `levels/` 目录中的关卡数据。

## 📞 技术支持

如有问题，请检查：
1. 服务器控制台的错误信息
2. 浏览器开发者工具的Network和Console面板
3. 确保网络连接正常

## 🎉 开始使用

1. 运行启动脚本启动服务器
2. 将显示的IP地址分享给团队成员
3. 团队成员打开浏览器访问该地址
4. 开始协作编辑关卡！

---

**祝您和团队使用愉快！** 🎮✨
