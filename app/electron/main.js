const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 添加日志信息
console.log('启动主进程...');
console.log('当前工作目录:', process.cwd());
console.log('__dirname:', __dirname);

let mainWindow;

function createWindow() {
  console.log('创建主窗口...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      worldSafeExecuteJavaScript: true, // 添加此项
      sandbox: false, // 允许在预加载脚本中使用Node.js API
      preload: path.join(__dirname, 'preload.js')
    }
  });

  console.log('预加载脚本路径:', path.join(__dirname, 'preload.js'), '文件存在:', fs.existsSync(path.join(__dirname, 'preload.js')));
  console.log('字典文件路径:', path.join(__dirname, 'dictionary.txt'), '文件存在:', fs.existsSync(path.join(__dirname, 'dictionary.txt')));
  console.log('备用字典路径:', path.join(__dirname, '../dictionary.txt'), '文件存在:', fs.existsSync(path.join(__dirname, '../dictionary.txt')));

  mainWindow.loadFile('index.html');
  
  // 开发环境下打开开发者工具
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  // 添加页面加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('窗口内容加载完成');
  });
  
  // 添加页面DOM就绪事件
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM就绪');
  });
  
  // 添加控制台消息监听
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['日志', '警告', '错误', '信息'];
    console.log(`渲染进程控制台[${levels[level] || level}]: ${message}`);
  });
}

// 等待Electron应用就绪
app.whenReady().then(async () => {
  console.log('应用就绪，初始化配置文件...');
  
  // 初始化配置文件
  await initializeConfigFiles();
  
  console.log('创建窗口...');
  createWindow();
  
  // 注册IPC处理程序
  console.log('已注册的IPC处理程序:', ipcMain.eventNames());
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// 添加一个函数来获取应用数据目录路径
function getAppDataPath() {
  // 使用app.getPath('userData')获取应用数据目录
  const userDataPath = app.getPath('userData');
  const levelsPath = path.join(userDataPath, 'levels');
  
  // 确保目录存在
  if (!fs.existsSync(levelsPath)) {
    fs.mkdirSync(levelsPath, { recursive: true });
    console.log('创建关卡目录:', levelsPath);
  }
  
  return levelsPath;
}

// 添加一个函数来获取外部配置文件目录路径
function getConfigDataPath() {
  // 使用app.getPath('userData')获取应用数据目录
  const userDataPath = app.getPath('userData');
  const configsPath = path.join(userDataPath, 'configs');
  
  // 确保目录存在
  if (!fs.existsSync(configsPath)) {
    fs.mkdirSync(configsPath, { recursive: true });
    console.log('创建配置目录:', configsPath);
  }
  
  return configsPath;
}

// 初始化配置文件（首次启动时从内部复制到外部）
async function initializeConfigFiles() {
  try {
    const configsPath = getConfigDataPath();
    const externalConfigPath = path.join(configsPath, 'lv1_500.json');
    
    // 如果外部配置文件不存在，从内部复制
    if (!fs.existsSync(externalConfigPath)) {
      console.log('外部配置文件不存在，正在从内部复制...');
      
      // 内部配置文件路径
      const internalConfigPath = path.join(__dirname, 'levels', 'lv1_500.json');
      
      if (fs.existsSync(internalConfigPath)) {
        // 复制文件
        fs.copyFileSync(internalConfigPath, externalConfigPath);
        console.log('配置文件已复制到:', externalConfigPath);
      } else {
        console.warn('内部配置文件不存在:', internalConfigPath);
      }
    } else {
      console.log('外部配置文件已存在:', externalConfigPath);
    }
    
    return configsPath;
  } catch (error) {
    console.error('初始化配置文件失败:', error);
    return null;
  }
}

// 处理保存配置文件
ipcMain.handle('save-config', async (event, config) => {
  console.log('接收到save-config请求');
  
  // 保存到应用数据目录
  const defaultDir = getAppDataPath();
  
  // 如果用户希望自定义保存位置，则显示对话框
  const { filePath } = await dialog.showSaveDialog({
    title: '保存 Word Search 关卡',
    defaultPath: path.join(defaultDir, `level_config_${Date.now()}.json`),
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  });

  if (!filePath) return { success: false, message: '保存已取消' };

  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    return { success: true, filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 处理保存关卡
ipcMain.handle('save-level', async (event, levelConfig, existingFilePath) => {
  console.log('接收到save-level请求', levelConfig, existingFilePath ? '覆盖模式' : '新建模式');
  
  // 如果提供了现有文件路径，则覆盖该文件
  if (existingFilePath && fs.existsSync(existingFilePath)) {
    try {
      // 将配置封装在一个数组中
      const finalConfig = [levelConfig];
      
      // 直接覆盖原文件
      fs.writeFileSync(existingFilePath, JSON.stringify(finalConfig, null, 2));
      console.log('关卡配置已覆盖保存到:', existingFilePath);
      return { success: true, filePath: existingFilePath };
    } catch (error) {
      console.error('覆盖保存关卡配置时出错:', error);
      return { success: false, message: error.message };
    }
  }
  
  // 否则保存为新文件
  // 保存到应用数据目录
  const defaultDir = getAppDataPath();
  
  // 生成文件名：level_[levelId].json 或 level_[timestamp].json
  const levelId = levelConfig.id || `${Date.now()}`;
  const filename = `level_${levelId}.json`;
  const filePath = path.join(defaultDir, filename);
  
  // 将配置封装在一个数组中，作为 JSON 文件的根元素
  const finalConfig = [levelConfig];
  
  try {
    // 直接保存到生成的文件路径，不显示保存对话框
    fs.writeFileSync(filePath, JSON.stringify(finalConfig, null, 2));
    console.log('关卡配置已保存到:', filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('保存关卡配置时出错:', error);
    return { success: false, message: error.message };
  }
});

// 处理生成关卡配置
ipcMain.handle('generate-level', async (event, levelConfig) => {
  console.log('接收到generate-level请求', levelConfig);
  
  try {
    // 显示保存对话框，让用户选择保存位置
    const { filePath } = await dialog.showSaveDialog({
      title: '保存生成的关卡',
      defaultPath: path.join(app.getPath('documents'), `level_${levelConfig.id || Date.now()}.json`),
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ]
    });
    
    if (!filePath) {
      console.log('用户取消了保存对话框');
      return { success: false, message: '用户取消了保存' };
    }
    
    // 将配置封装在一个数组中，作为 JSON 文件的根元素
    const finalConfig = [levelConfig];
    
    // 保存文件
    fs.writeFileSync(filePath, JSON.stringify(finalConfig, null, 2));
    console.log('生成的关卡配置已保存到:', filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('生成关卡配置时出错:', error);
    return { success: false, message: error.message };
  }
});

// 处理读取词频CSV文件
ipcMain.handle('read-frequency-csv', async (event) => {
  console.log('接收到read-frequency-csv请求');
  
  // CSV文件路径
  const csvPath = path.join(__dirname, 'BNC_COCA.csv');
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(csvPath)) {
      console.log('BNC_COCA.csv文件不存在:', csvPath);
      return { success: false, message: '词频文件不存在' };
    }
    
    // 读取文件内容
    const content = fs.readFileSync(csvPath, 'utf-8');
    console.log('词频CSV文件读取成功，大小:', content.length, '字节');
    
    return { success: true, content };
  } catch (error) {
    console.error('读取词频CSV文件失败:', error);
    return { success: false, message: error.message };
  }
});

// 处理删除关卡文件
ipcMain.handle('delete-level', async (event, filePath) => {
  console.log('接收到delete-level请求', filePath);
  
  if (!filePath) {
    return { success: false, message: '未提供文件路径' };
  }
  
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 尝试检查是否是相对路径问题，可能在打包环境中路径变了
      const levelFileName = path.basename(filePath);
      const correctPath = path.join(getAppDataPath(), levelFileName);
      
      console.log('尝试替代路径:', correctPath);
      
      // 检查替代路径下的文件是否存在
      if (fs.existsSync(correctPath)) {
        // 使用正确的路径删除文件
        fs.unlinkSync(correctPath);
        console.log('已删除关卡文件(替代路径):', correctPath);
        return { success: true };
      }
      
      return { success: false, message: '文件不存在' };
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    console.log('已删除关卡文件:', filePath);
    return { success: true };
  } catch (error) {
    console.error('删除关卡文件时出错:', error);
    return { success: false, message: error.message };
  }
});

// 处理获取保存的关卡列表
ipcMain.handle('get-saved-levels', async (event) => {
  console.log('接收到get-saved-levels请求');
  
  // 用于保存编辑器关卡的目录 - 使用应用数据目录
  const editorLevelsDir = getAppDataPath();
  
  try {
    // 获取目录中的所有.json文件
    const files = fs.readdirSync(editorLevelsDir)
      .filter(file => file.endsWith('.json'));
    
    // 读取每个文件的内容
    const levels = [];
    for (const file of files) {
      try {
        const filePath = path.join(editorLevelsDir, file);
        const stats = fs.statSync(filePath);
        
        // 如果是常规文件
        if (stats.isFile()) {
          const data = fs.readFileSync(filePath, 'utf8');
          const levelData = JSON.parse(data);
          
          // 添加文件路径信息，以便后续加载
          if (levelData) {
            // 可能是来自saveLevel的数组格式，也可能是来自saveConfig的单个对象
            if (Array.isArray(levelData) && levelData.length > 0) {
              // 处理saveLevel保存的格式
              const level = levelData[0];
              // 确保level字段是数字类型
              if (level.level) {
                level.level = parseInt(level.level, 10);
              }
              levels.push({
                ...level,
                _filePath: filePath, // 添加文件路径用于后续操作
                _fileType: 'level'
              });
            } else {
              // 处理saveConfig保存的格式
              // 确保level字段是数字类型
              if (levelData.level) {
                levelData.level = parseInt(levelData.level, 10);
              }
              levels.push({
                ...levelData,
                _filePath: filePath, // 添加文件路径用于后续操作
                _fileType: 'config'
              });
            }
          }
        }
      } catch (err) {
        console.error(`读取文件 ${file} 时出错:`, err);
        // 继续处理下一个文件
      }
    }
    
    console.log(`找到 ${levels.length} 个保存的关卡`);
    
    // 按照创建时间降序排序
    levels.sort((a, b) => {
      const dateA = a.metadata?.createdAt ? new Date(a.metadata.createdAt) : new Date(0);
      const dateB = b.metadata?.createdAt ? new Date(b.metadata.createdAt) : new Date(0);
      return dateB - dateA; // 降序排序，最新的在前面
    });
    
    return levels;
  } catch (error) {
    console.error('获取关卡列表时出错:', error);
    throw error;
  }
});

// 处理打开文件对话框
ipcMain.handle('open-file-dialog', async (event, options) => {
  console.log('接收到open-file-dialog请求', options);
  
  try {
    // 显示打开文件对话框
    const result = await dialog.showOpenDialog(options);
    console.log('文件对话框结果:', result);
    
    // 如果用户选择了文件，返回第一个文件的路径
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      return { success: true, filePath: result.filePaths[0] };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('打开文件对话框出错:', error);
    return { success: false, error: error.message };
  }
});

// 处理读取文件内容
ipcMain.handle('read-file', async (event, filePath) => {
  console.log('接收到read-file请求', filePath);
  
  if (!filePath) {
    return { success: false, message: '未提供文件路径' };
  }
  
  // 确保filePath是字符串类型
  if (typeof filePath !== 'string') {
    console.error('filePath不是字符串类型:', typeof filePath, filePath);
    return { success: false, message: '文件路径格式错误' };
  }
  
  try {
    let resolvedPath = filePath;
    
    // 特殊处理：对于lv1_500.json，优先从外部配置目录读取
    if (filePath === 'levels/lv1_500.json' || filePath.endsWith('lv1_500.json')) {
      const configsPath = getConfigDataPath();
      const externalConfigPath = path.join(configsPath, 'lv1_500.json');
      
      console.log('检测到lv1_500.json请求，优先尝试外部配置:', externalConfigPath);
      
      if (fs.existsSync(externalConfigPath)) {
        const content = fs.readFileSync(externalConfigPath, 'utf-8');
        console.log('从外部配置读取成功:', externalConfigPath, '大小:', content.length, '字节');
        return { success: true, content, source: 'external' };
      } else {
        console.log('外部配置文件不存在，回退到内部资源');
      }
    }
    
    // 如果是相对路径，尝试解析为绝对路径
    if (!path.isAbsolute(filePath)) {
      // 首先尝试相对于应用根目录
      resolvedPath = path.join(__dirname, filePath);
      console.log('尝试应用根目录路径:', resolvedPath);
      
      // 如果不存在，尝试相对于资源目录（打包后的情况）
      if (!fs.existsSync(resolvedPath)) {
        const resourcePath = process.resourcesPath || __dirname;
        resolvedPath = path.join(resourcePath, 'app', filePath);
        console.log('尝试资源目录路径:', resolvedPath);
        
        // 还是不存在，尝试另一种打包路径
        if (!fs.existsSync(resolvedPath)) {
          resolvedPath = path.join(resourcePath, filePath);
          console.log('尝试资源根目录路径:', resolvedPath);
        }
      }
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(resolvedPath)) {
      console.log('文件不存在:', resolvedPath);
      console.log('原始路径:', filePath);
      console.log('当前工作目录:', process.cwd());
      console.log('__dirname:', __dirname);
      console.log('process.resourcesPath:', process.resourcesPath);
      return { success: false, message: `文件不存在: ${resolvedPath}` };
    }
    
    // 读取文件内容
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    console.log('文件读取成功，路径:', resolvedPath, '大小:', content.length, '字节');
    return { success: true, content };
  } catch (error) {
    console.error('读取文件出错:', error);
    return { success: false, message: error.message };
  }
});

// 处理打开配置文件夹请求
ipcMain.handle('open-config-folder', async (event) => {
  console.log('接收到open-config-folder请求');
  
  try {
    const configsPath = getConfigDataPath();
    console.log('打开配置文件夹:', configsPath);
    
    // 使用shell.openPath打开文件夹
    const { shell } = require('electron');
    await shell.openPath(configsPath);
    
    return { success: true, path: configsPath };
  } catch (error) {
    console.error('打开配置文件夹失败:', error);
    return { success: false, message: error.message };
  }
});