const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { networkInterfaces } = require('os');
const AuthManager = require('./auth');

const app = express();
const PORT = 3000;

// 初始化权限管理器
const authManager = new AuthManager();

// 目录配置 - 支持环境变量配置
const LEVELS_DIR = process.env.LEVELS_DIR || path.join(__dirname, '..', 'data', 'levels'); // 关卡数据目录
const CONFIGS_DIR = process.env.CONFIGS_DIR || path.join(__dirname, '..', 'config'); // 配置文件目录
const FORMAL_LEVELS_DIR = path.join(__dirname, '..', 'data', 'levels'); // 正式关卡目录（备用）
const DICTIONARIES_DIR = process.env.DICTIONARIES_DIR || path.join(__dirname, '..', 'data'); // 词典文件目录
const PUBLIC_DIR = path.join(__dirname, '..', 'app', 'web', 'public'); // 静态文件目录

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['x-session-id']
}));
app.use(express.json({ limit: '50mb' }));

// 认证相关路由
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authManager.authenticate(username, password);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败', details: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const result = authManager.logout(sessionId);
  res.json(result);
});

app.get('/api/auth/status', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const result = authManager.checkAuthStatus(sessionId);
  res.json(result);
});

// 根路由 - 权限检查和重定向
app.get('/', (req, res) => {
  if (authManager.authConfig.auth.enabled) {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const authStatus = authManager.checkAuthStatus(sessionId);
    
    if (!authStatus.authenticated) {
      res.redirect('/login.html');
      return;
    }
  }
  
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use(express.static(PUBLIC_DIR)); // 静态文件服务

// 文件上传配置
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB限制
});

class WordSearchServer {
  constructor() {
    this.setupRoutes();
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(LEVELS_DIR, { recursive: true });
      await fs.mkdir(PUBLIC_DIR, { recursive: true });
      await fs.mkdir('uploads', { recursive: true });
      console.log('📁 目录结构检查完成');
    } catch (error) {
      console.error('创建目录失败:', error);
    }
  }

  setupRoutes() {
    // 健康检查
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // 获取所有关卡（带权限检查和用户隔离）
    app.get('/api/levels', authManager.requireAuth('read'), async (req, res) => {
      try {
        console.log('📖 获取关卡列表请求', req.user ? `用户: ${req.user.displayName}` : '');
        const files = await fs.readdir(LEVELS_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const levels = [];
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(LEVELS_DIR, file);
            const content = await fs.readFile(filePath, 'utf8');
            const levelData = JSON.parse(content);
            const stats = await fs.stat(filePath);
            
            // 检查是否是关卡数组（如lv1_500.json）
            if (Array.isArray(levelData)) {
              console.log(`📚 发现关卡集合文件: ${file}, 包含 ${levelData.length} 个关卡`);
              // 为数组中的每个关卡添加文件信息
              levelData.forEach((level, index) => {
                // 确保level是对象，如果是字符串则跳过
                if (typeof level === 'object' && level !== null) {
                  // 检查用户是否可以访问这个关卡
                  if (authManager.canAccessLevel(req.user, level.createdBy || 'unknown')) {
                    level._filePath = `${file}#${index}`; // 使用特殊格式标识数组中的关卡
                    level._sourceFile = file;
                    level._arrayIndex = index;
                    level._lastModified = stats.mtime;
                    level._fileSize = Math.round(stats.size / levelData.length); // 估算单个关卡大小
                    
                    // 添加创建者与最后编辑者信息
                    if (level.createdBy) {
                      const creator = authManager.getUserById(level.createdBy);
                      level._createdByName = creator ? creator.displayName : '未知用户';
                    } else {
                      level._createdByName = '未知用户';
                    }
                    if (level.lastModifiedBy) {
                      const editor = authManager.getUserById(level.lastModifiedBy);
                      level._lastModifiedByName = editor ? editor.displayName : undefined;
                    }
                    
                    levels.push(level);
                  }
                } else {
                  console.warn(`跳过无效的关卡数据: ${file}[${index}] - ${typeof level}`);
                }
              });
            } else {
              // 单个关卡文件
              // 检查用户是否可以访问这个关卡
              if (authManager.canAccessLevel(req.user, levelData.createdBy || 'unknown')) {
                levelData._filePath = file;
                levelData._lastModified = stats.mtime;
                levelData._fileSize = stats.size;
                
                // 添加创建者与最后编辑者信息
                if (levelData.createdBy) {
                  const creator = authManager.getUserById(levelData.createdBy);
                  levelData._createdByName = creator ? creator.displayName : '未知用户';
                } else {
                  levelData._createdByName = '未知用户';
                }
                if (levelData.lastModifiedBy) {
                  const editor = authManager.getUserById(levelData.lastModifiedBy);
                  levelData._lastModifiedByName = editor ? editor.displayName : undefined;
                }
                
                levels.push(levelData);
              }
            }
          } catch (fileError) {
            console.error(`读取关卡文件 ${file} 失败:`, fileError);
          }
        }
        
        console.log(`✅ 成功加载 ${levels.length} 个关卡 (用户: ${req.user ? req.user.displayName : '匿名'})`);
        res.json(levels);
      } catch (error) {
        console.error('获取关卡列表失败:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 获取单个关卡
    app.get('/api/levels/:filename', async (req, res) => {
      try {
        const filename = req.params.filename;
        
        // 检查是否是数组中的关卡（格式：filename#index）
        if (filename.includes('#')) {
          const [sourceFile, indexStr] = filename.split('#');
          const index = parseInt(indexStr);
          const filePath = path.join(LEVELS_DIR, sourceFile);
          
          const content = await fs.readFile(filePath, 'utf8');
          const levelArray = JSON.parse(content);
          
          if (Array.isArray(levelArray) && levelArray[index]) {
            const level = levelArray[index];
            level._filePath = filename;
            level._sourceFile = sourceFile;
            level._arrayIndex = index;
            res.json(level);
          } else {
            res.status(404).json({ error: '关卡索引不存在' });
          }
        } else {
          // 单个关卡文件
          const filePath = path.join(LEVELS_DIR, filename);
          const content = await fs.readFile(filePath, 'utf8');
          const levelData = JSON.parse(content);
          res.json(levelData);
        }
      } catch (error) {
        console.error('获取关卡失败:', error);
        res.status(404).json({ error: '关卡不存在' });
      }
    });

    // 保存关卡（带权限检查和创建者信息）
    app.post('/api/levels', authManager.requireAuth('create'), async (req, res) => {
      try {
        const levelData = req.body;
        const overwriteFile = req.query.overwrite; // 是否覆盖现有文件
        
        console.log('💾 保存关卡请求:', {
          level: levelData.level,
          title: levelData.title,
          overwrite: overwriteFile,
          user: req.user.displayName
        });
        
        let fileName;
        if (overwriteFile && overwriteFile !== 'null') {
          // 覆盖现有文件 - 检查权限
          const existingFilePath = path.join(LEVELS_DIR, overwriteFile);
          try {
            const existingContent = await fs.readFile(existingFilePath, 'utf8');
            const existingLevel = JSON.parse(existingContent);
            
            // 检查用户是否有权限修改这个关卡
            if (!authManager.canAccessLevel(req.user, existingLevel.createdBy)) {
              return res.status(403).json({ 
                error: '无权限修改此关卡', 
                code: 'CANNOT_MODIFY_OTHERS_LEVEL' 
              });
            }
          } catch (error) {
            console.warn('无法读取现有关卡文件，将作为新文件创建');
          }
          
          fileName = overwriteFile;
        } else {
          // 创建新文件
          const levelNum = levelData.level || Date.now();
          const titlePart = levelData.title ? '_' + levelData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') : '';
          fileName = `level_${levelNum}${titlePart}_${Date.now()}.json`;
        }
        
        const filePath = path.join(LEVELS_DIR, fileName);
        
        // 添加创建者信息
        if (!levelData.createdBy) {
          levelData.createdBy = req.user.id;
          levelData.createdAt = new Date().toISOString();
        }
        levelData.lastModifiedBy = req.user.id;
        levelData.lastModifiedAt = new Date().toISOString();
        
        // 添加服务器端元数据
        levelData.serverMetadata = {
          savedAt: new Date().toISOString(),
          savedBy: req.user.id,
          savedByName: req.user.displayName,
          fileName: fileName,
          version: '1.0.0'
        };
        
        await fs.writeFile(filePath, JSON.stringify(levelData, null, 2));
        
        console.log(`✅ 关卡已保存: ${fileName}`);
        res.json({ 
          success: true, 
          fileName, 
          filePath: fileName,
          message: '关卡保存成功' 
        });
      } catch (error) {
        console.error('保存关卡失败:', error);
        res.status(500).json({ 
          success: false,
          error: error.message 
        });
      }
    });

    // 删除关卡（带权限检查）
    app.delete('/api/levels/:filename', authManager.requireAuth('delete'), async (req, res) => {
      try {
        const filename = req.params.filename;
        console.log('🗑️ 删除关卡请求:', filename, '用户:', req.user.displayName);
        
        // 检查是否是数组中的关卡（格式：filename#index）
        if (filename.includes('#')) {
          // 数组中的关卡不支持单独删除
          return res.status(400).json({ 
            success: false, 
            message: '无法删除关卡集合中的单个关卡，请删除整个文件或导出后重新导入' 
          });
        } else {
          // 单个关卡文件
          const filePath = path.join(LEVELS_DIR, filename);
          
          // 检查文件是否存在
          try {
            await fs.access(filePath);
          } catch {
            return res.status(404).json({ 
              success: false, 
              message: '关卡文件不存在' 
            });
          }
          
          // 检查用户是否有权限删除这个关卡
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const levelData = JSON.parse(content);
            
            if (!authManager.canAccessLevel(req.user, levelData.createdBy)) {
              return res.status(403).json({ 
                success: false,
                error: '无权限删除此关卡', 
                code: 'CANNOT_DELETE_OTHERS_LEVEL' 
              });
            }
          } catch (error) {
            console.warn('无法读取关卡文件进行权限检查:', error);
          }
          
          await fs.unlink(filePath);
          
          console.log(`✅ 关卡已删除: ${filename}`);
          res.json({ 
            success: true, 
            message: '关卡删除成功' 
          });
        }
      } catch (error) {
        console.error('删除关卡失败:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // 批量导入关卡
    app.post('/api/levels/batch-import', upload.single('file'), async (req, res) => {
      try {
        console.log('📥 批量导入关卡请求');
        
        if (!req.file) {
          return res.status(400).json({ error: '没有上传文件' });
        }
        
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        let levels;
        
        try {
          levels = JSON.parse(fileContent);
        } catch (parseError) {
          await fs.unlink(req.file.path); // 清理临时文件
          return res.status(400).json({ error: 'JSON格式错误' });
        }
        
        if (!Array.isArray(levels)) {
          levels = [levels];
        }
        
        const results = [];
        const timestamp = Date.now();
        
        for (let i = 0; i < levels.length; i++) {
          try {
            const level = levels[i];
            const levelNum = level.level || (i + 1);
            const fileName = `imported_level_${levelNum}_${timestamp}_${i}.json`;
            const filePath = path.join(LEVELS_DIR, fileName);
            
            // 添加导入元数据
            level.serverMetadata = {
              importedAt: new Date().toISOString(),
              importedBy: req.ip,
              originalIndex: i,
              fileName: fileName
            };
            
            await fs.writeFile(filePath, JSON.stringify(level, null, 2));
            results.push({ 
              index: i,
              fileName, 
              success: true,
              level: levelNum,
              title: level.title || '无标题'
            });
          } catch (levelError) {
            console.error(`导入关卡 ${i} 失败:`, levelError);
            results.push({ 
              index: i,
              success: false, 
              error: levelError.message 
            });
          }
        }
        
        // 清理上传的临时文件
        await fs.unlink(req.file.path);
        
        const successCount = results.filter(r => r.success).length;
        console.log(`✅ 批量导入完成: ${successCount}/${levels.length} 个关卡成功`);
        
        res.json({ 
          success: true, 
          imported: successCount,
          total: levels.length,
          results 
        });
      } catch (error) {
        console.error('批量导入失败:', error);
        // 清理临时文件
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch {}
        }
        res.status(500).json({ error: error.message });
      }
    });

    // 获取正式关卡数据（如lv1_500.json，用于词频分析等）
    app.get('/api/formal-levels/:filename', async (req, res) => {
      try {
        const filename = req.params.filename;
        let filePath;
        let source = 'formal';
        
        console.log('📖 获取正式关卡文件:', filename);
        
        // 优先从用户配置目录读取（如lv1_500.json）
        const configPath = path.join(CONFIGS_DIR, filename);
        const formalPath = path.join(FORMAL_LEVELS_DIR, filename);
        
        try {
          await fs.access(configPath);
          filePath = configPath;
          source = 'user_config';
          console.log('📚 使用用户配置文件:', configPath);
        } catch {
          try {
            await fs.access(formalPath);
            filePath = formalPath;
            source = 'formal';
            console.log('📚 使用正式关卡文件:', formalPath);
          } catch {
            throw new Error('正式关卡文件不存在');
          }
        }
        
        const content = await fs.readFile(filePath, 'utf8');
        const levelData = JSON.parse(content);
        
        res.json({
          success: true,
          data: levelData,
          filename,
          source,
          filePath,
          isArray: Array.isArray(levelData),
          count: Array.isArray(levelData) ? levelData.length : 1
        });
      } catch (error) {
        console.error('获取正式关卡失败:', error);
        res.status(404).json({ 
          success: false,
          error: error.message || '正式关卡文件不存在' 
        });
      }
    });

    // 词频CSV数据API（公开，无需鉴权）
    app.get('/api/frequency/csv', async (req, res) => {
      try {
        const csvPath = path.join(__dirname, '..', 'data', 'BNC_COCA.csv');
        console.log('📚 [CSV] 收到请求: /api/frequency/csv');
        console.log('📚 [CSV] 文件路径:', csvPath);
        console.log('📚 [CSV] 开始读取...');
        
        if (fsSync.existsSync(csvPath)) {
          const csvContent = await fs.readFile(csvPath, 'utf8');
          console.log('📚 [CSV] 读取完成，长度:', csvContent.length);
          console.log('📚 [CSV] 前100字符:', csvContent.substring(0, 100));
          res.json({ success: true, content: csvContent });
          console.log('📚 [CSV] 响应成功');
        } else {
          console.log('📚 [CSV] BNC_COCA.csv 文件不存在，返回404');
          res.status(404).json({ success: false, message: 'CSV文件不存在' });
        }
      } catch (error) {
        console.error('📚 [CSV] 读取词频CSV文件失败:', error);
        res.status(500).json({ success: false, message: '读取词频文件失败' });
      }
    });

    // 读取词典文件
    app.get('/api/dictionary/:type', async (req, res) => {
      try {
        const type = req.params.type;
        let fileName;
        
        switch (type) {
          case 'bnc_coca':
            fileName = 'BNC_COCA.csv';
            break;
          case 'dictionary':
            fileName = 'dictionary.txt';
            break;
          default:
            return res.status(400).json({ error: '不支持的词典类型' });
        }
        
        const filePath = path.join(DICTIONARIES_DIR, fileName);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          res.json({ 
            success: true,
            content, 
            type,
            fileName 
          });
        } catch (fileError) {
          console.log(`词典文件 ${fileName} 不存在，返回空内容`);
          res.json({ 
            success: true,
            content: '', 
            type,
            fileName,
            note: '词典文件不存在'
          });
        }
      } catch (error) {
        console.error('读取词典失败:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 生成关卡配置文件（下载）
    app.post('/api/levels/generate', async (req, res) => {
      try {
        const levelConfig = req.body;
        console.log('📄 生成关卡配置请求:', levelConfig.title);
        
        const fileName = `level_${levelConfig.level || 'config'}_${Date.now()}.json`;
        
        // 设置下载头部
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        res.json(levelConfig);
      } catch (error) {
        console.error('生成关卡配置失败:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // 获取服务器信息
    app.get('/api/info', (req, res) => {
      res.json({
        name: 'Word Search Level Editor Server',
        version: '1.0.0',
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version,
        levelsDirectory: LEVELS_DIR,
        publicDirectory: PUBLIC_DIR
      });
    });
  }

  getLocalIP() {
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // 跳过内部地址和非IPv4地址
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return 'localhost';
  }

  start() {
    app.listen(PORT, '0.0.0.0', () => {
      const localIP = this.getLocalIP();
      
      console.log('\n🚀 Word Search Level Editor Server 已启动!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 本地访问: http://localhost:${PORT}`);
      console.log(`🌐 团队访问: http://${localIP}:${PORT}`);
      console.log(`📁 关卡目录: ${LEVELS_DIR}`);
      console.log(`📚 词典目录: ${DICTIONARIES_DIR}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 团队成员可以通过浏览器访问上述网址使用编辑器');
      console.log('⚠️  请确保您的电脑和团队成员在同一网络环境中');
      console.log('\n按 Ctrl+C 停止服务器\n');
    });

    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n🛑 服务器正在关闭...');
      process.exit(0);
    });
  }
}

// 启动服务器
const server = new WordSearchServer();
server.start();
