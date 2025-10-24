// 自动保存管理器
class AutoSaveManager {
  constructor() {
    this.autoSaveInterval = null;
    this.autoSaveEnabled = true;
    this.autoSaveFrequency = 3 * 60 * 1000; // 3分钟自动保存一次
    this.lastSaveTime = Date.now();
    this.hasUnsavedChanges = false;
    this.isDraftMode = false; // 是否为草稿模式
    
    // 会话警告相关
    this.sessionWarningThreshold = 10 * 60 * 1000; // 会话过期前10分钟警告
    this.sessionCheckInterval = null;
    this.lastActivityTime = Date.now();
    
    console.log('✅ 自动保存管理器已初始化');
  }
  
  // 启动自动保存
  start() {
    if (this.autoSaveInterval) {
      console.log('⚠️ 自动保存已在运行');
      return;
    }
    
    console.log(`🔄 启动自动保存（每${this.autoSaveFrequency / 60000}分钟）`);
    
    // 自动保存定时器
    this.autoSaveInterval = setInterval(() => {
      this.performAutoSave();
    }, this.autoSaveFrequency);
    
    // 会话检查定时器（每分钟检查一次）
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionExpiry();
    }, 60 * 1000);
    
    // 监听用户活动
    this.setupActivityTracking();
    
    // 页面关闭前保存
    this.setupBeforeUnloadHandler();
  }
  
  // 停止自动保存
  stop() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏸️ 自动保存已停止');
    }
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
  
  // 执行自动保存
  async performAutoSave() {
    if (!this.autoSaveEnabled) {
      console.log('⏭️ 自动保存已禁用，跳过');
      return;
    }
    
    if (!this.hasUnsavedChanges) {
      console.log('⏭️ 没有未保存的更改，跳过自动保存');
      return;
    }
    
    try {
      console.log('💾 执行自动保存...');
      
      // 获取当前关卡数据
      const levelData = this.getCurrentLevelData();
      if (!levelData) {
        console.log('⚠️ 无法获取关卡数据，跳过自动保存');
        return;
      }
      
      // 标记为自动保存
      levelData._autoSaved = true;
      levelData._autoSaveTime = new Date().toISOString();
      
      // 保存到服务器
      const result = await window.electronAPI.saveLevel(levelData, window.currentLevelFilePath);
      
      if (result.success) {
        // 如果是新创建的关卡，保存文件路径以便后续编辑
        if (!window.currentLevelFilePath && result.filePath) {
          window.currentLevelFilePath = result.filePath;
          console.log('💾 自动保存：首次保存，记录文件路径:', window.currentLevelFilePath);
        }
        
        this.lastSaveTime = Date.now();
        this.hasUnsavedChanges = false;
        this.showAutoSaveNotification('success');
        console.log('✅ 自动保存成功');
      } else {
        this.showAutoSaveNotification('error', result.message);
        console.error('❌ 自动保存失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 自动保存失败:', error);
      
      // 如果是会话过期错误，保存到本地存储
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        this.saveDraftToLocalStorage();
      } else {
        this.showAutoSaveNotification('error', error.message);
      }
    }
  }
  
  // 获取当前关卡数据
  getCurrentLevelData() {
    try {
      if (!window.gridInstance || !window.wordListInstance) {
        return null;
      }
      
      // 获取标题和等级
      const titleElement = document.getElementById('edit-level-title');
      const levelNumberElement = document.getElementById('edit-level-number');
      const difficultyElement = document.getElementById('edit-level-difficulty');
      const radsRewardElement = document.getElementById('editor-has-rads-reward');
      
      const title = titleElement ? titleElement.value.trim() : 'Untitled';
      const levelNumber = levelNumberElement ? parseInt(levelNumberElement.value) || 1 : 1;
      const difficulty = difficultyElement ? parseInt(difficultyElement.value) || 0 : 0;
      const hasRadsReward = radsRewardElement ? radsRewardElement.checked : false;
      
      // 获取网格和单词数据
      const gridData = window.gridInstance.getGridData();
      const wordListData = window.wordListInstance.getWordListData();
      
      const levelData = {
        title: title,
        level: levelNumber,
        grid: gridData,
        wordList: wordListData,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      if (difficulty > 0) {
        levelData.difficulty = difficulty;
        levelData.diff = difficulty;
      }
      
      if (hasRadsReward) {
        levelData.has_rads_reward = true;
      }
      
      return levelData;
    } catch (error) {
      console.error('获取关卡数据失败:', error);
      return null;
    }
  }
  
  // 保存草稿到本地存储
  saveDraftToLocalStorage() {
    try {
      const levelData = this.getCurrentLevelData();
      if (!levelData) return;
      
      levelData._isDraft = true;
      levelData._draftSavedAt = new Date().toISOString();
      
      localStorage.setItem('levelDraft', JSON.stringify(levelData));
      console.log('💾 草稿已保存到本地存储');
      this.showAutoSaveNotification('draft');
    } catch (error) {
      console.error('保存草稿失败:', error);
    }
  }
  
  // 恢复草稿
  restoreDraft() {
    try {
      const draftData = localStorage.getItem('levelDraft');
      if (!draftData) {
        console.log('📭 没有找到草稿');
        return null;
      }
      
      const levelData = JSON.parse(draftData);
      console.log('📬 发现草稿，保存于', levelData._draftSavedAt);
      return levelData;
    } catch (error) {
      console.error('恢复草稿失败:', error);
      return null;
    }
  }
  
  // 清除草稿
  clearDraft() {
    localStorage.removeItem('levelDraft');
    console.log('🗑️ 草稿已清除');
  }
  
  // 检查会话是否即将过期
  async checkSessionExpiry() {
    try {
      // 获取会话状态
      const response = await fetch('/api/auth/status', {
        headers: window.electronAPI.getHeaders()
      });
      
      const data = await response.json();
      
      if (!data.authenticated) {
        console.warn('⚠️ 会话已过期');
        this.saveDraftToLocalStorage();
        return;
      }
      
      // 计算剩余时间
      if (data.expiresAt) {
        const remainingTime = data.expiresAt - Date.now();
        const remainingMinutes = Math.floor(remainingTime / 60000);
        
        console.log(`⏱️ 会话剩余时间: ${remainingMinutes} 分钟`);
        
        // 如果剩余时间少于阈值，显示警告
        if (remainingTime < this.sessionWarningThreshold && remainingTime > 0) {
          this.showSessionWarning(remainingMinutes);
        }
      }
    } catch (error) {
      console.error('检查会话状态失败:', error);
    }
  }
  
  // 显示会话过期警告
  showSessionWarning(remainingMinutes) {
    const notification = document.createElement('div');
    notification.className = 'session-warning-notification';
    notification.innerHTML = `
      <div class="session-warning-content">
        <span class="warning-icon">⏰</span>
        <div class="warning-text">
          <strong>会话即将过期</strong>
          <p>您的会话将在 ${remainingMinutes} 分钟后过期，请及时保存工作</p>
        </div>
        <button class="dismiss-warning">知道了</button>
      </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 350px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 绑定关闭按钮
    const dismissBtn = notification.querySelector('.dismiss-warning');
    dismissBtn.onclick = () => notification.remove();
    
    // 10秒后自动关闭
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }
  
  // 显示自动保存通知
  showAutoSaveNotification(type = 'success', message = '') {
    // 移除旧通知
    const oldNotification = document.getElementById('autosave-notification');
    if (oldNotification) {
      oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'autosave-notification';
    notification.className = `autosave-notification ${type}`;
    
    let icon = '✓';
    let text = '自动保存成功';
    let bgColor = '#4caf50';
    
    if (type === 'error') {
      icon = '✗';
      text = '自动保存失败';
      bgColor = '#f44336';
      if (message) text += `: ${message}`;
    } else if (type === 'draft') {
      icon = '💾';
      text = '已保存到草稿';
      bgColor = '#2196f3';
    }
    
    notification.innerHTML = `
      <span class="icon">${icon}</span>
      <span class="text">${text}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.3s ease;
      opacity: 0.9;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后移除
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // 标记有未保存的更改
  markAsUnsaved() {
    this.hasUnsavedChanges = true;
    this.lastActivityTime = Date.now();
  }
  
  // 标记为已保存
  markAsSaved() {
    this.hasUnsavedChanges = false;
    this.lastSaveTime = Date.now();
  }
  
  // 监听用户活动
  setupActivityTracking() {
    // 监听网格变化
    document.addEventListener('wordGridChanged', () => {
      this.markAsUnsaved();
    });
    
    // 监听单词列表变化
    const wordListElement = document.getElementById('word-list');
    if (wordListElement) {
      const observer = new MutationObserver(() => {
        this.markAsUnsaved();
      });
      observer.observe(wordListElement, { childList: true, subtree: true });
    }
    
    // 监听输入框变化
    const titleInput = document.getElementById('edit-level-title');
    const levelInput = document.getElementById('edit-level-number');
    
    if (titleInput) {
      titleInput.addEventListener('input', () => this.markAsUnsaved());
    }
    if (levelInput) {
      levelInput.addEventListener('input', () => this.markAsUnsaved());
    }
  }
  
  // 设置页面关闭前处理
  setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        // 保存草稿
        this.saveDraftToLocalStorage();
        
        // 显示确认对话框
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    });
  }
  
  // 手动保存后调用
  onManualSave() {
    this.markAsSaved();
    this.clearDraft();
    console.log('✅ 手动保存完成，清除草稿');
  }
}

// 创建全局实例
if (typeof window !== 'undefined') {
  window.AutoSaveManager = AutoSaveManager;
}

