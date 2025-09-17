// WebAPI适配器 - 替换electronAPI，提供与服务器通信的功能
class WebAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.isWebVersion = true;
    this.sessionId = localStorage.getItem('sessionId');
  }

  // 获取请求头（包含会话ID）
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.sessionId) {
      headers['x-session-id'] = this.sessionId;
    }
    return headers;
  }

  // 检查认证状态
  async checkAuth() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/status`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      
      if (data.authRequired && !data.authenticated) {
        // 清除无效的sessionId
        localStorage.removeItem('sessionId');
        this.sessionId = null;
        
        // 跳转到登录页面
        window.location.href = '/login.html';
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }

  // 处理API请求的通用方法
  async request(url, options = {}) {
    // 检查认证状态
    if (!(await this.checkAuth())) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options.headers }
    });

    // 处理认证错误
    if (response.status === 401) {
      localStorage.removeItem('sessionId');
      this.sessionId = null;
      window.location.href = '/login.html';
      throw new Error('Session expired');
    }

    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(`权限不足: ${errorData.error}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  // 登录
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.sessionId = result.sessionId;
        localStorage.setItem('sessionId', result.sessionId);
      }
      
      return result;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 登出
  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      // 即使请求失败也清除本地会话
      this.sessionId = null;
      localStorage.removeItem('sessionId');
      throw error;
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      // 直接调用认证状态API，不通过request方法避免循环调用
      const response = await fetch(`${this.baseURL}/api/auth/status`, {
        headers: this.getHeaders()
      });
      const data = await response.json();
      return data.authenticated ? data.user : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // 读取词频CSV数据
  async readFrequencyCSV() {
    try {
      console.log('🌐 WebAPI: 读取词频CSV文件');
      const response = await this.request('/api/frequency/csv');
      const data = await response.json();
      console.log('✅ WebAPI: 词频CSV文件读取成功');
      return data;
    } catch (error) {
      console.error('WebAPI: 获取词频CSV数据失败:', error);
      return { success: false, message: '获取词频数据失败' };
    }
  }

  // 获取所有保存的关卡
  async getSavedLevels() {
    try {
      console.log('🌐 WebAPI: 获取关卡列表');
      const response = await this.request('/api/levels');
      const levels = await response.json();
      console.log(`✅ WebAPI: 成功获取 ${levels.length} 个关卡`);
      return levels;
    } catch (error) {
      console.error('WebAPI: 获取关卡列表失败:', error);
      throw error;
    }
  }

  // 保存关卡
  async saveLevel(levelData, currentFilePath = null) {
    try {
      console.log('🌐 WebAPI: 保存关卡', {
        level: levelData.level,
        title: levelData.title,
        overwrite: currentFilePath
      });
      
      // 构建查询参数
      const params = new URLSearchParams();
      if (currentFilePath && currentFilePath !== 'null') {
        // 从完整路径中提取文件名
        const fileName = currentFilePath.includes('/') ? 
          currentFilePath.split('/').pop() : 
          currentFilePath;
        params.append('overwrite', fileName);
      }
      
      const url = `/api/levels${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await this.request(url, {
        method: 'POST',
        body: JSON.stringify(levelData)
      });
      
      const result = await response.json();
      console.log('✅ WebAPI: 关卡保存成功', result);
      return result;
    } catch (error) {
      console.error('WebAPI: 保存关卡失败:', error);
      throw error;
    }
  }

  // 删除关卡
  async deleteLevel(filePath) {
    try {
      // 从完整路径中提取文件名
      const fileName = filePath.includes('/') ? 
        filePath.split('/').pop() : 
        filePath;
      
      console.log('🌐 WebAPI: 删除关卡', fileName);
      // 使用统一request以自动携带x-session-id
      const response = await this.request(`/api/levels/${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      console.log('✅ WebAPI: 关卡删除成功');
      return result;
    } catch (error) {
      console.error('WebAPI: 删除关卡失败:', error);
      throw error;
    }
  }

  // 生成关卡配置文件（下载）
  async generateLevel(levelConfig) {
    try {
      console.log('🌐 WebAPI: 生成关卡配置');
      
      // 创建下载
      const fileName = `level_${levelConfig.level || 'config'}_${Date.now()}.json`;
      const blob = new Blob([JSON.stringify(levelConfig, null, 2)], {
        type: 'application/json'
      });
      
      // 触发下载
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ WebAPI: 关卡配置已生成并下载');
      return { 
        success: true, 
        fileName,
        message: '关卡配置已下载' 
      };
    } catch (error) {
      console.error('WebAPI: 生成关卡配置失败:', error);
      throw error;
    }
  }

  // 打开文件选择对话框
  async openFileDialog() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.style.display = 'none';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve({ 
            success: true, 
            file,
            filePath: file.name // 网页版本中，我们使用文件对象而不是路径
          });
        } else {
          resolve({ 
            success: false, 
            canceled: true 
          });
        }
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        resolve({ 
          success: false, 
          canceled: true 
        });
        document.body.removeChild(input);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }

  // 读取文件内容
  async readFile(fileOrPath) {
    try {
      let file;
      
      if (typeof fileOrPath === 'string') {
        // 如果是路径字符串，这在网页版中不支持
        throw new Error('网页版不支持直接读取文件路径，请使用文件选择');
      } else if (fileOrPath instanceof File) {
        // 如果是File对象
        file = fileOrPath;
      } else {
        throw new Error('不支持的文件类型');
      }
      
      const content = await this.readFileAsText(file);
      return {
        success: true,
        content,
        fileName: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('WebAPI: 读取文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 读取文件为文本
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('读取文件失败'));
      reader.readAsText(file, 'utf-8');
    });
  }

  // 读取词典数据
  async readDictionary(type = 'dictionary') {
    try {
      console.log('🌐 WebAPI: 读取词典', type);
      const response = await fetch(`${this.baseURL}/api/dictionary/${type}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ WebAPI: 词典读取成功');
      return result.content;
    } catch (error) {
      console.error('WebAPI: 读取词典失败:', error);
      throw error;
    }
  }

  // 读取正式关卡文件（如lv1_500.json，用于词频分析等）
  async readFormalLevel(filename) {
    try {
      console.log('🌐 WebAPI: 读取正式关卡文件', filename);
      const response = await fetch(`${this.baseURL}/api/formal-levels/${filename}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ WebAPI: 正式关卡文件读取成功');
      return {
        success: true,
        content: JSON.stringify(result.data),
        data: result.data,
        isArray: result.isArray,
        count: result.count
      };
    } catch (error) {
      console.error('WebAPI: 读取正式关卡文件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 批量导入关卡（网页版实现）
  async batchImportLevels(file) {
    try {
      console.log('🌐 WebAPI: 批量导入关卡');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseURL}/api/levels/batch-import`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ WebAPI: 批量导入成功', result);
      return result;
    } catch (error) {
      console.error('WebAPI: 批量导入失败:', error);
      throw error;
    }
  }

  // 获取服务器信息
  async getServerInfo() {
    try {
      const response = await fetch(`${this.baseURL}/api/info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('WebAPI: 获取服务器信息失败:', error);
      throw error;
    }
  }

  // 检查服务器连接
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 在网页环境中替换electronAPI
if (typeof window !== 'undefined') {
  // 检测是否为网页环境
  if (!window.electronAPI || !window.electronAPI.saveLevel) {
    console.log('🌐 检测到网页环境，初始化WebAPI...');
    const webApiInstance = new WebAPI();
    window.electronAPI = webApiInstance; // 兼容现有代码
    window.webAPI = webApiInstance; // 新的引用方式
    window.isWebVersion = true;
    
    // 添加连接状态检查
    window.addEventListener('load', async () => {
      const isConnected = await window.electronAPI.checkConnection();
      if (isConnected) {
        console.log('✅ 服务器连接正常');
        const info = await window.electronAPI.getServerInfo();
        console.log('📋 服务器信息:', info);
      } else {
        console.error('❌ 无法连接到服务器');
        alert('无法连接到服务器，请确保服务器已启动');
      }
    });
  } else {
    console.log('🖥️ 检测到Electron环境，使用原生API');
    window.isWebVersion = false;
  }
}

// 导出供Node.js使用（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebAPI;
}
