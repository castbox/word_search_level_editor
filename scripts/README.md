# 启动脚本说明

本目录包含两个核心启动脚本：

## 🏠 本地开发服务器

```bash
./scripts/start-local.sh
```

- **用途**: 本地开发和测试
- **特点**: 带身份校验，使用本地数据
- **访问**: http://localhost:3000
- **登录**: yanyi / yanyi123

## 🌐 生产服务器

```bash
./scripts/start-server.sh
```

- **用途**: 服务器部署和生产环境
- **特点**: 自动安装依赖，带身份校验
- **说明**: 适用于服务器部署

## 📝 使用说明

1. 确保已安装 Node.js
2. 在项目根目录运行对应的启动脚本
3. 首次运行会自动安装依赖
4. 使用 Ctrl+C 停止服务器

## ⚙️ 配置文件

- `config/local-config.sh`: 本地环境配置
- `config/auth-config.json`: 身份验证配置
- `server/server.js`: 主服务器文件
