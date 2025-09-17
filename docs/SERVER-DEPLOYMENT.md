# 🚀 服务器部署指南

## 📋 部署概述

这份指南将帮助您将Word Search关卡编辑器部署到公司服务器上，让团队成员通过浏览器访问使用。

## 🎯 部署目标

- ✅ 团队成员通过浏览器访问编辑器
- ✅ 不依赖您的个人电脑
- ✅ 支持多用户同时使用
- ✅ 数据持久化存储
- ✅ 用户权限管理

## 📦 部署前准备

### 1. 服务器要求
- **操作系统**: Linux (Ubuntu/CentOS) 或 Windows Server
- **内存**: 最少 1GB RAM
- **存储**: 最少 10GB 可用空间
- **网络**: 开放端口 3000（或自定义端口）

### 2. 软件依赖
- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **Git**: 用于代码更新（可选）

## 🛠️ 部署步骤

### 方式1: 自动部署（推荐）

1. **上传项目文件到服务器**
```bash
# 将整个项目目录上传到服务器
scp -r word_search_level_editor/ user@your-server:/opt/
```

2. **运行部署脚本**
```bash
cd /opt/word_search_level_editor
./deploy-server.sh
```

3. **启动服务**
```bash
# 方式1: 直接启动（测试用）
./start-production.sh

# 方式2: PM2启动（推荐）
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 方式2: 手动部署

1. **安装Node.js**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

2. **配置项目**
```bash
cd /opt/word_search_level_editor
cp package-server.json package.json
npm install --production
```

3. **创建目录**
```bash
mkdir -p levels uploads logs
chmod 755 levels uploads logs
```

4. **启动服务**
```bash
NODE_ENV=production PORT=3000 node server.js
```

## 🌐 网络配置

### 1. 防火墙配置

**Ubuntu/Debian:**
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**CentOS/RHEL:**
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**Windows Server:**
```powershell
New-NetFirewallRule -DisplayName "Word Search Editor" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 2. 域名配置（可选）

如果您有域名，可以配置Nginx反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 👥 用户管理配置

### 1. 修改默认管理员密码

编辑 `auth-config.json`:
```json
{
  "auth": {
    "enabled": true,
    "users": [
      {
        "id": "admin",
        "username": "admin",
        "password": "新密码",
        "displayName": "管理员",
        "role": "admin"
      }
    ]
  }
}
```

### 2. 添加团队成员账号

```json
{
  "id": "user1",
  "username": "张三",
  "password": "user123",
  "displayName": "张三",
  "role": "user"
}
```

## 🔧 进程管理

### 使用PM2（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs word-search-editor

# 重启应用
pm2 restart word-search-editor

# 停止应用
pm2 stop word-search-editor

# 开机自启动
pm2 save
pm2 startup
```

### 使用系统服务（Linux）

```bash
# 安装服务
sudo cp word-search-editor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable word-search-editor

# 控制服务
sudo systemctl start word-search-editor
sudo systemctl status word-search-editor
sudo systemctl stop word-search-editor
sudo systemctl restart word-search-editor
```

## 📊 监控和维护

### 1. 日志查看

```bash
# PM2日志
pm2 logs word-search-editor

# 系统服务日志
sudo journalctl -u word-search-editor -f

# 应用日志
tail -f logs/combined.log
```

### 2. 性能监控

```bash
# PM2监控
pm2 monit

# 系统资源
htop
df -h
free -h
```

### 3. 数据备份

```bash
# 备份关卡数据
tar -czf levels-backup-$(date +%Y%m%d).tar.gz levels/

# 定期备份脚本
echo "0 2 * * * cd /opt/word_search_level_editor && tar -czf /backup/levels-\$(date +\%Y\%m\%d).tar.gz levels/" | crontab -
```

## 🔒 安全建议

### 1. 基本安全设置
- ✅ 修改默认管理员密码
- ✅ 配置防火墙只开放必要端口
- ✅ 定期更新系统和依赖包
- ✅ 使用HTTPS（配置SSL证书）

### 2. 高级安全设置
```bash
# 限制文件权限
chmod 600 auth-config.json
chown -R www-data:www-data levels/

# 配置fail2ban（防暴力破解）
sudo apt-get install fail2ban
```

## 🌍 访问方式

部署完成后，团队成员可以通过以下方式访问：

- **直接IP访问**: `http://服务器IP:3000`
- **域名访问**: `http://your-domain.com`（如果配置了域名）
- **内网访问**: `http://内网IP:3000`

## 🆘 故障排除

### 常见问题

1. **服务启动失败**
```bash
# 检查端口占用
netstat -tlnp | grep 3000
# 检查Node.js版本
node --version
# 检查依赖
npm list
```

2. **无法访问**
```bash
# 检查防火墙
sudo ufw status
# 检查服务状态
pm2 status
# 检查网络连通性
curl http://localhost:3000/health
```

3. **性能问题**
```bash
# 查看资源使用
pm2 monit
# 重启应用
pm2 restart word-search-editor
```

## 📞 技术支持

如遇到问题，请提供：
1. 错误日志截图
2. 服务器配置信息
3. 网络环境描述
4. 具体操作步骤

## 🎉 部署完成

恭喜！您的Word Search关卡编辑器已成功部署到服务器。

**下一步：**
1. 访问 `http://服务器IP:3000` 测试功能
2. 将访问地址分享给团队成员
3. 创建团队成员账号
4. 开始协作编辑关卡！

---

**祝您使用愉快！** 🎮✨
