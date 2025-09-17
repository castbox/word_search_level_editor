// 预加载脚本，用于设置IPC通信
const { ipcRenderer, contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

// 检查模块是否已正确加载
console.log('preload.js: 开始加载，ipcRenderer =', !!ipcRenderer, 'contextBridge =', !!contextBridge);

// 确保字典文件路径正确
const dictPath = path.join(__dirname, 'dictionary.txt');
console.log('dictionary.txt 路径:', dictPath, '文件存在:', fs.existsSync(dictPath));

// 如果字典文件不存在于当前目录，尝试上一级目录
const altDictPath = path.join(__dirname, '../dictionary.txt');
console.log('备用 dictionary.txt 路径:', altDictPath, '文件存在:', fs.existsSync(altDictPath));

// 将ipcRenderer暴露给渲染进程
try {
  contextBridge.exposeInMainWorld('ipcRenderer', {
    invoke: (channel, ...args) => {
      // 允许的IPC通道
      const validChannels = ['save-config', 'save-level', 'get-saved-levels', 'delete-level', 'generate-level', 'open-file-dialog', 'read-file', 'read-frequency-csv', 'open-config-folder'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      
      throw new Error(`不允许的IPC通道: ${channel}`);
    }
  });
  console.log('preload.js: ipcRenderer 已成功暴露给渲染进程');
} catch (error) {
  console.error('preload.js: 暴露 ipcRenderer 时出错:', error);
}

// 暴露fs和path模块的部分安全API
try {
  contextBridge.exposeInMainWorld('fsAPI', {
    existsSync: (filePath) => {
      try {
        return fs.existsSync(filePath);
      } catch (error) {
        console.error('fsAPI.existsSync 出错:', error);
        return false;
      }
    },
    statSync: (filePath) => {
      try {
        const stats = fs.statSync(filePath);
        return {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime
        };
      } catch (error) {
        console.error('fsAPI.statSync 出错:', error);
        return null;
      }
    }
  });
  
  contextBridge.exposeInMainWorld('pathAPI', {
    basename: (filePath, ext) => path.basename(filePath, ext),
    join: (...paths) => path.join(...paths),
    dirname: (filePath) => path.dirname(filePath)
  });
  
  console.log('preload.js: fsAPI 和 pathAPI 已成功暴露给渲染进程');
} catch (error) {
  console.error('preload.js: 暴露 fsAPI 和 pathAPI 时出错:', error);
}

// 为渲染进程提供API
const electronAPI = {
  saveConfig: (config) => {
    console.log('preload: 调用saveConfig');
    return ipcRenderer.invoke('save-config', config);
  },
  saveLevel: (levelConfig, filePath) => {
    console.log('preload: 调用saveLevel', filePath ? '覆盖模式' : '新建模式');
    return ipcRenderer.invoke('save-level', levelConfig, filePath);
  },
  generateLevel: (levelConfig) => {
    console.log('preload: 调用generateLevel');
    return ipcRenderer.invoke('generate-level', levelConfig);
  },
  getSavedLevels: () => {
    console.log('preload: 调用getSavedLevels');
    return ipcRenderer.invoke('get-saved-levels');
  },
  deleteLevel: (filePath) => {
    console.log('preload: 调用deleteLevel', filePath);
    return ipcRenderer.invoke('delete-level', filePath);
  },
  readDictionary: () => {
    console.log('preload: 尝试读取字典文件');
    try {
      // 优先尝试直接路径
      if (fs.existsSync(dictPath)) {
        console.log('preload: 使用直接路径读取字典');
        const content = fs.readFileSync(dictPath, 'utf-8');
        console.log('preload: 读取字典成功，大小:', content.length, '字节');
        return content;
      } 
      // 尝试备用路径
      else if (fs.existsSync(altDictPath)) {
        console.log('preload: 使用备用路径读取字典');
        const content = fs.readFileSync(altDictPath, 'utf-8');
        console.log('preload: 读取字典成功，大小:', content.length, '字节');
        return content;
      }
      // 找不到字典文件
      else {
        console.error('preload: 字典文件不存在，尝试过的路径:', dictPath, altDictPath);
        return '';
      }
    } catch (e) {
      console.error('preload: 读取字典失败:', e.message);
      return '';
    }
  },
  openFileDialog: (options) => {
    console.log('preload: 调用openFileDialog');
    return ipcRenderer.invoke('open-file-dialog', options);
  },
  readFile: (filePath) => {
    console.log('preload: 调用readFile', filePath);
    return ipcRenderer.invoke('read-file', filePath);
  },
  readFrequencyCSV: () => {
    console.log('preload: 调用readFrequencyCSV');
    return ipcRenderer.invoke('read-frequency-csv');
  },
  openConfigFolder: () => {
    console.log('preload: 调用openConfigFolder');
    return ipcRenderer.invoke('open-config-folder');
  }
};

// 确保API被正确暴露
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('preload: electronAPI 已成功暴露给渲染进程');
  
  // 验证API是否正确暴露
  const apiMethods = Object.keys(electronAPI);
  console.log('preload: API方法已暴露:', apiMethods.join(', '));
} catch (error) {
  console.error('preload: 暴露 electronAPI 时出错:', error);
}

console.log('预加载脚本已执行完成'); 