# ⚡ 快速部署指南

## 🎯 5分钟部署到服务器

### 前提条件
- 服务器已安装 Node.js (v14+) 和 npm
- 有服务器的SSH访问权限

### 步骤1: 上传项目
```bash
# 将项目打包上传到服务器
scp -r word_search_level_editor/ user@your-server:/opt/
```

### 步骤2: 一键部署
```bash
# 登录服务器
ssh user@your-server

# 进入项目目录
cd /opt/word_search_level_editor

# 运行部署脚本
./deploy-server.sh

# 启动服务
./start-production.sh
```

### 步骤3: 访问测试
打开浏览器访问：`http://服务器IP:3000`

---

## 🐳 Docker部署（推荐）

如果服务器支持Docker，这是最简单的部署方式：

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问：`http://服务器IP:3000`

---

## 🔧 生产环境优化

### 使用PM2管理进程
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 配置Nginx反向代理
```bash
sudo apt-get install nginx
# 参考 nginx-config-example.conf 配置文件
```

---

## 👥 团队访问设置

1. **获取服务器IP地址**
2. **分享给团队**: `http://服务器IP:3000`
3. **创建用户账号**: 登录管理员账号添加团队成员
4. **开始协作**！

---

## 🆘 遇到问题？

1. **检查端口**: `netstat -tlnp | grep 3000`
2. **检查防火墙**: `sudo ufw allow 3000`
3. **查看日志**: `pm2 logs` 或 `docker-compose logs`
4. **重启服务**: `pm2 restart word-search-editor`

---

**🎉 部署完成！团队现在可以通过浏览器访问编辑器了！**
