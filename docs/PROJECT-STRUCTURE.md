# 📁 项目结构说明

## 🎯 重组目标

将混乱的文件结构重新整理为清晰、逻辑性强的目录结构，便于开发、维护和部署。

## 📋 新目录结构

```
word_search_level_editor/
├── 📱 app/                     # 应用程序代码
│   ├── electron/              # Electron桌面应用
│   │   ├── main.js            # Electron主进程
│   │   ├── preload.js         # 预加载脚本
│   │   ├── level_editor.js    # 关卡编辑器
│   │   └── index.html         # Electron界面
│   ├── web/                   # Web应用
│   │   └── public/            # 静态文件
│   │       ├── index.html     # Web主页面
│   │       ├── login.html     # 登录页面
│   │       └── src/           # 前端源码
│   └── shared/                # 共享代码
│       ├── scripts/           # 共享脚本
│       └── styles/            # 共享样式
│
├── 🖥️  server/                 # 服务器端代码
│   ├── server.js              # 服务器主文件
│   ├── auth.js                # 认证模块
│   ├── config/                # 服务器配置
│   │   ├── auth-config.json   # 认证配置
│   │   └── load-env.js        # 环境变量加载
│   └── scripts/               # 启动脚本
│       ├── start-local.sh     # 本地启动（无认证）
│       ├── start-local-auth.sh# 本地启动（带认证）
│       ├── start.sh           # 启动选择器
│       └── restore-auth.sh    # 认证恢复
│
├── 🚀 deployment/              # 部署相关
│   ├── scripts/               # 部署脚本
│   │   ├── deploy-server.sh   # 服务器部署
│   │   ├── migrate-data.sh    # 数据迁移
│   │   └── backup-local-data.sh# 数据备份
│   ├── docker/                # Docker配置
│   │   ├── Dockerfile         # Docker镜像配置
│   │   ├── docker-compose.yml # Docker编排
│   │   └── .dockerignore      # Docker忽略文件
│   └── docs/                  # 部署文档
│       ├── SERVER-DEPLOYMENT.md
│       ├── DATA-MIGRATION.md
│       └── QUICK-DEPLOY.md
│
├── 🛠️  tools/                  # 开发工具
│   ├── scripts/               # 工具脚本
│   └── configs/               # 配置模板
│       ├── local-config.sh    # 本地环境配置
│       ├── server-config.sh   # 服务器环境配置
│       ├── env.example        # 环境变量示例
│       └── server.env.example # 服务器环境示例
│
├── 📚 data/                    # 数据文件
│   ├── dictionaries/          # 词典数据
│   │   ├── BNC_COCA.csv       # 词频数据
│   │   └── dictionary.txt     # 词典文件
│   └── sample-levels/         # 示例关卡
│       └── lv1_500.json       # 示例关卡数据
│
├── 📖 docs/                    # 项目文档
│   ├── user/                  # 用户文档
│   │   ├── README.md          # 项目说明
│   │   ├── README-WEB-SERVER.md
│   │   ├── LOCAL-STARTUP.md   # 本地启动指南
│   │   └── TEAM-ACCESS.md     # 团队访问指南
│   ├── dev/                   # 开发文档
│   │   └── ENVIRONMENT-CONFIG.md
│   └── deployment/            # 部署文档
│       └── [部署相关文档]
│
└── 📦 [根目录保留]              # 项目根文件
    ├── package.json           # 项目配置
    ├── package-lock.json      # 依赖锁定
    ├── package-server.json    # 服务器包配置
    ├── node_modules/          # 依赖包
    ├── build/                 # 构建输出
    ├── dist/                  # 分发包
    └── uploads/               # 文件上传目录
```

## 🔄 重组前后对比

### 重组前（混乱状态）
- ❌ 根目录文件过多（50+ 个文件）
- ❌ 功能相关文件分散
- ❌ 启动脚本到处都是
- ❌ 文档分散，难以查找
- ❌ 配置文件混杂

### 重组后（清晰结构）
- ✅ 按功能分类组织
- ✅ 相关文件集中管理
- ✅ 启动脚本统一位置
- ✅ 文档分类清晰
- ✅ 配置文件集中

## 🎯 各目录功能

### 📱 app/ - 应用程序代码
- **electron/**: Electron桌面应用相关文件
- **web/**: Web版本应用文件
- **shared/**: 两个版本共享的代码

### 🖥️ server/ - 服务器代码
- **server.js**: 主服务器文件
- **auth.js**: 用户认证模块
- **config/**: 服务器配置文件
- **scripts/**: 启动和管理脚本

### 🚀 deployment/ - 部署相关
- **scripts/**: 部署、迁移、备份脚本
- **docker/**: Docker容器化配置
- **docs/**: 部署相关文档

### 🛠️ tools/ - 开发工具
- **scripts/**: 开发辅助脚本
- **configs/**: 各种配置模板

### 📚 data/ - 数据文件
- **dictionaries/**: 词典和词频数据
- **sample-levels/**: 示例关卡数据

### 📖 docs/ - 项目文档
- **user/**: 用户使用文档
- **dev/**: 开发相关文档
- **deployment/**: 部署相关文档

## 🚀 重组执行

运行重组脚本：
```bash
./reorganize.sh
```

## ⚠️ 重组注意事项

1. **备份重要数据**: 重组前建议备份重要文件
2. **更新路径引用**: 重组后需要更新文件中的路径引用
3. **测试功能**: 重组后测试所有功能是否正常
4. **更新文档**: 更新相关文档中的路径说明

## 🎉 重组优势

- ✅ **更清晰**: 文件按功能分类，易于查找
- ✅ **更专业**: 符合标准项目结构规范
- ✅ **更易维护**: 相关文件集中，便于维护
- ✅ **更易协作**: 团队成员容易理解项目结构
- ✅ **更易扩展**: 新功能有明确的放置位置

