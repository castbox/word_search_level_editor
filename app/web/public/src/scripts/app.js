// 关卡导航管理器
class LevelNavigationManager {
  constructor() {
    this.allLevels = []; // 存储所有关卡数据
    this.currentLevelIndex = -1; // 当前关卡在列表中的索引
    this.isFromLevelList = false; // 标记是否从关卡列表进入编辑器
    
    // 绑定导航按钮事件
    this.bindNavigationEvents();
    
    console.log('关卡导航管理器已初始化');
    console.log('LevelNavigationManager: constructor完成，准备检查DOM元素');
    
    // 检查DOM元素是否存在
    setTimeout(() => {
      const navControls = document.getElementById('level-navigation-controls');
      console.log('LevelNavigationManager: level-navigation-controls DOM元素:', !!navControls);
      if (navControls) {
        console.log('LevelNavigationManager: 导航控件当前显示状态:', navControls.style.display);
      }
    }, 1000);
  }
  
  // 绑定导航按钮事件
  bindNavigationEvents() {
    const prevBtn = document.getElementById('prev-level-btn');
    const nextBtn = document.getElementById('next-level-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateToPreviousLevel());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateToNextLevel());
    }
    
    console.log('关卡导航按钮事件已绑定');
  }
  
  // 设置关卡列表并激活导航
  async setLevelList(sourceFromLevelList = false) {
    try {
      console.log('LevelNavigationManager: 开始设置关卡列表, sourceFromLevelList =', sourceFromLevelList);
      
      // 获取所有关卡列表
      const levels = await window.electronAPI.getSavedLevels();
      
      if (!levels || levels.length === 0) {
        console.log('没有找到关卡，隐藏导航控件');
        this.hideNavigationControls();
        return;
      }
      
      // 按照关卡等级排序
      this.allLevels = levels.sort((a, b) => {
        const levelA = parseInt(a.level) || 0;
        const levelB = parseInt(b.level) || 0;
        return levelA - levelB;
      });
      
      this.isFromLevelList = sourceFromLevelList;
      console.log('LevelNavigationManager: isFromLevelList 设置为', this.isFromLevelList);
      
      // 如果是从关卡列表进入，显示导航控件
      if (this.isFromLevelList) {
        console.log('LevelNavigationManager: 准备显示导航控件');
        this.showNavigationControls();
        this.updateCurrentLevelIndex();
      } else {
        console.log('LevelNavigationManager: 不是从关卡列表进入，隐藏导航控件');
        this.hideNavigationControls();
      }
      
      console.log(`已加载 ${this.allLevels.length} 个关卡到导航器中`);
      
    } catch (error) {
      console.error('设置关卡列表失败:', error);
      this.hideNavigationControls();
    }
  }
  
  // 更新当前关卡索引
  updateCurrentLevelIndex() {
    console.log('LevelNavigationManager: 更新当前关卡索引');
    console.log('LevelNavigationManager: currentLevelFilePath =', window.currentLevelFilePath);
    console.log('LevelNavigationManager: allLevels 数量 =', this.allLevels.length);
    
    if (!window.currentLevelFilePath || this.allLevels.length === 0) {
      this.currentLevelIndex = -1;
      this.updateNavigationDisplay();
      return;
    }
    
    // 根据当前文件路径找到对应的关卡索引
    this.currentLevelIndex = this.allLevels.findIndex(level => 
      level._filePath === window.currentLevelFilePath
    );
    
    if (this.currentLevelIndex === -1) {
      console.warn('无法找到当前关卡在列表中的位置');
      console.log('LevelNavigationManager: 当前文件路径:', window.currentLevelFilePath);
      console.log('LevelNavigationManager: 可用关卡路径:', this.allLevels.map(l => l._filePath));
    }
    
    this.updateNavigationDisplay();
    console.log(`当前关卡索引: ${this.currentLevelIndex + 1} / ${this.allLevels.length}`);
  }
  
  // 更新导航显示
  updateNavigationDisplay() {
    const navInfo = document.getElementById('level-nav-info');
    const prevBtn = document.getElementById('prev-level-btn');
    const nextBtn = document.getElementById('next-level-btn');
    
    if (!navInfo || !prevBtn || !nextBtn) return;
    
    if (this.currentLevelIndex === -1 || this.allLevels.length === 0) {
      navInfo.textContent = '- / -';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    
    // 更新显示文本
    navInfo.textContent = `${this.currentLevelIndex + 1} / ${this.allLevels.length}`;
    
    // 更新按钮状态
    prevBtn.disabled = this.currentLevelIndex <= 0;
    nextBtn.disabled = this.currentLevelIndex >= this.allLevels.length - 1;
  }
  
  // 导航到上一个关卡
  async navigateToPreviousLevel() {
    if (this.currentLevelIndex <= 0 || this.allLevels.length === 0) {
      showStatusMessage('已经是第一个关卡了', 'info');
      return;
    }
    
    const targetIndex = this.currentLevelIndex - 1;
    await this.navigateToLevel(targetIndex);
  }
  
  // 导航到下一个关卡
  async navigateToNextLevel() {
    if (this.currentLevelIndex >= this.allLevels.length - 1 || this.allLevels.length === 0) {
      showStatusMessage('已经是最后一个关卡了', 'info');
      return;
    }
    
    const targetIndex = this.currentLevelIndex + 1;
    await this.navigateToLevel(targetIndex);
  }
  
  // 导航到指定索引的关卡
  async navigateToLevel(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.allLevels.length) {
      console.error('目标关卡索引超出范围:', targetIndex);
      return;
    }
    
    try {
      const targetLevel = this.allLevels[targetIndex];
      
      showStatusMessage('正在加载关卡...', 'info');
      
      // 使用完整的关卡加载逻辑（包括单词列表数据）
      if (window.navigation && typeof window.navigation.loadLevelForEditing === 'function') {
        console.log('开始加载关卡数据到编辑器:', targetLevel);
        // 使用和从关卡列表点击编辑相同的加载方法，但跳过导航设置
        window.navigation.loadLevelForEditing(targetLevel, true);
      } else {
        console.error('navigation.loadLevelForEditing 方法不可用，回退到基本加载');
        loadLevelIntoEditor(targetLevel);
        // 更新当前关卡文件路径
        window.currentLevelFilePath = targetLevel._filePath;
      }
      
      this.currentLevelIndex = targetIndex;
      
      // 更新导航显示
      this.updateNavigationDisplay();
      
      const levelTitle = targetLevel.title || targetLevel.name || `关卡${targetLevel.level || ''}`;
      console.log(`已导航到关卡 ${targetIndex + 1}: ${levelTitle}`);
      
    } catch (error) {
      console.error('导航到关卡失败:', error);
      showStatusMessage(`加载关卡失败: ${error.message}`, 'error');
    }
  }
  
  // 显示导航控件
  showNavigationControls() {
    const navControls = document.getElementById('level-navigation-controls');
    if (navControls) {
      navControls.style.display = 'flex';
      console.log('显示关卡导航控件');
    } else {
      console.error('找不到关卡导航控件元素!');
    }
  }
  
  // 隐藏导航控件
  hideNavigationControls() {
    const navControls = document.getElementById('level-navigation-controls');
    if (navControls) {
      navControls.style.display = 'none';
      console.log('隐藏关卡导航控件');
    }
  }
  
  // 当关卡被保存时调用此方法刷新关卡列表
  async refreshLevelList() {
    if (this.isFromLevelList) {
      await this.setLevelList(true);
      console.log('关卡列表已刷新');
    }
  }
}

// 主应用逻辑
// 注意：在渲染进程中我们使用preload暴露的fsAPI和pathAPI，而不是直接的fs和path模块
// 这些变量将在预加载脚本中实际提供
// const fs = require('fs');
// const path = require('path');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM完全加载，开始初始化应用...');
  
  // 立即检查API
  let apiAvailable = checkElectronAPI();
  
  // 如果API不可用，尝试延迟再次检查
  if (!apiAvailable) {
    console.log('尝试延迟500ms后再次检查electronAPI...');
    setTimeout(() => {
      apiAvailable = checkElectronAPI();
      if (apiAvailable) {
        console.log('延迟检查成功，electronAPI现在可用了!');
      } else {
        console.error('延迟检查失败，electronAPI仍然不可用!');
      }
    }, 500);
  }
  
  // 创建导航实例，使其全局可访问
  window.navigation = new Navigation();
  const navigation = window.navigation;
  
  // 再次清空当前关卡文件路径，防止残留
  window.currentLevelFilePath = null;
  
  // 创建网格实例并全局可访问
  window.gridInstance = new Grid();
  const gridInstance = window.gridInstance;
  
  // 监听页面导航事件，在非关卡列表页面隐藏导航控件
  window.addEventListener('pageNavigated', (event) => {
    if (window.levelNavigationManager) {
      if (event.detail && event.detail.pageId !== 'editor') {
        // 离开编辑器页面时隐藏导航控件
        window.levelNavigationManager.hideNavigationControls();
      }
    }
  });
  
  // 创建单词列表实例
  window.wordListInstance = new WordList(gridInstance);
  
  // 全局初始化奖励单词数据结构
  window.bonusWordsData = {
    words: [],
    wordsWithPositions: []
  };
  
  // 初始化关卡导航管理器
  try {
    console.log('尝试初始化关卡导航管理器...');
    window.levelNavigationManager = new LevelNavigationManager();
    console.log('关卡导航管理器初始化成功');
  } catch (error) {
    console.error('关卡导航管理器初始化失败:', error);
  }
  
  // 初始化词频分析器
  window.wordFrequencyInstance = new WordFrequency();
  window.globalFrequencyAnalyzer = window.wordFrequencyInstance; // 创建别名以保持向后兼容
  
  // 监听保存关卡事件，用于刷新词频分析
  window.addEventListener('levelSaved', () => {
    if (window.wordFrequencyInstance) {
      window.wordFrequencyInstance.refreshAnalysis();
    }
  });

  // 初始化自动保存管理器（不自动启动，由 navigateTo 方法控制）
  if (typeof AutoSaveManager !== 'undefined') {
    window.autoSaveManager = new AutoSaveManager();
    console.log('✅ 自动保存管理器已创建（等待进入编辑器页面时启动）');
  }

  
  // 绑定按钮
  const saveButton = document.getElementById('save-level');
  const autoFillButton = document.getElementById('auto-fill');
  const generateLevelButton = document.getElementById('generate-level');
  const backButton = document.getElementById('back-to-config');
  const checkDuplicatesBtn = document.getElementById('check-duplicates');
  const editLevelTitleInput = document.getElementById('edit-level-title');
  const editLevelNumberInput = document.getElementById('edit-level-number');
  const viewBonusWordsButton = document.getElementById('view-bonus-words');
  const helpButton = document.getElementById('help-btn');
  
  // 网格大小控制按钮
  const increaseWidthButton = document.getElementById('increase-width');
  const decreaseWidthButton = document.getElementById('decrease-width');
  const increaseHeightButton = document.getElementById('increase-height');
  const decreaseHeightButton = document.getElementById('decrease-height');
  
  // 网格大小输入框
  const widthInput = document.getElementById('width-input');
  const heightInput = document.getElementById('height-input');
  
  // 确保所有按钮存在
  if (saveButton) console.log('找到保存关卡按钮');
  if (autoFillButton) console.log('找到自动填充按钮');
  if (generateLevelButton) console.log('找到生成配置文件按钮');
  if (backButton) console.log('找到返回按钮');
  if (editLevelNumberInput) console.log('找到关卡等级输入框');
  if (viewBonusWordsButton) console.log('找到查看奖励单词按钮');
  if (helpButton) console.log('找到帮助按钮');
  
  // 初始禁用查看奖励单词按钮
  if (viewBonusWordsButton) {
    viewBonusWordsButton.disabled = true;
    viewBonusWordsButton.classList.add('disabled');
    viewBonusWordsButton.textContent = '无奖励单词';
  }
  
  // 绑定网格大小控制按钮事件
  if (increaseWidthButton) {
    increaseWidthButton.addEventListener('click', () => {
      gridInstance.increaseWidth();
      updateGridSizeInputs();
    });
  }

  if (decreaseWidthButton) {
    decreaseWidthButton.addEventListener('click', () => {
      gridInstance.decreaseWidth();
      updateGridSizeInputs();
    });
  }

  if (increaseHeightButton) {
    increaseHeightButton.addEventListener('click', () => {
      gridInstance.increaseHeight();
      updateGridSizeInputs();
    });
  }

  if (decreaseHeightButton) {
    decreaseHeightButton.addEventListener('click', () => {
      gridInstance.decreaseHeight();
      updateGridSizeInputs();
    });
  }

  // 绑定网格大小输入框事件
  if (widthInput) {
    widthInput.addEventListener('change', () => {
      const newWidth = parseInt(widthInput.value, 10);
      if (newWidth >= 5 && newWidth <= 20) {
        setGridWidth(newWidth);
      } else {
        // 恢复原值
        widthInput.value = gridInstance.width;
        showStatusMessage('宽度必须在5-20之间', 'error');
      }
    });

    widthInput.addEventListener('blur', () => {
      // 确保输入框显示正确的值
      widthInput.value = gridInstance.width;
    });
  }

  if (heightInput) {
    heightInput.addEventListener('change', () => {
      const newHeight = parseInt(heightInput.value, 10);
      if (newHeight >= 5 && newHeight <= 20) {
        setGridHeight(newHeight);
      } else {
        // 恢复原值
        heightInput.value = gridInstance.height;
        showStatusMessage('高度必须在5-20之间', 'error');
      }
    });

    heightInput.addEventListener('blur', () => {
      // 确保输入框显示正确的值
      heightInput.value = gridInstance.height;
    });
  }
  
  // 初始化帮助模态框
  initHelpModal();
  
  // 初始化网格大小输入框的值
  updateGridSizeInputs();
  
  // 标题同步功能
  const levelTitleDisplay = document.getElementById('level-title-display');
  
  // 初始化编辑标题输入框
  editLevelTitleInput.value = levelTitleDisplay.textContent !== 'Word Search 关卡编辑器' ? 
    levelTitleDisplay.textContent : '';
  
  // 编辑标题输入框事件
  editLevelTitleInput.addEventListener('input', () => {
    const newTitle = editLevelTitleInput.value.trim();
    // 更新显示的标题
    levelTitleDisplay.textContent = newTitle || 'Word Search 关卡编辑器';
  });
  
  // 绑定关卡等级输入框事件，用于更新词频分析范围
  if (editLevelNumberInput) {
    // 设置初始关卡等级
    const initialLevelNumber = parseInt(editLevelNumberInput.value) || 1;
    if (window.globalFrequencyAnalyzer) {
      window.globalFrequencyAnalyzer.setCurrentLevelNumber(initialLevelNumber);
      console.log(`初始关卡等级设置为: ${initialLevelNumber}`);
    }
    
    editLevelNumberInput.addEventListener('input', () => {
      const levelNumber = parseInt(editLevelNumberInput.value) || 1;
      if (window.globalFrequencyAnalyzer) {
        console.log(`用户修改关卡等级为: ${levelNumber}`);
        window.globalFrequencyAnalyzer.setCurrentLevelNumber(levelNumber);
        
        // 触发自定义事件，通知其他组件关卡等级已变化
        window.dispatchEvent(new CustomEvent('levelNumberChanged', {
          detail: { levelNumber }
        }));
      }
    });
    
    console.log('关卡等级输入框事件监听器已绑定');
  }
  
  // 绑定自动填充按钮事件
  if (autoFillButton) {
    autoFillButton.addEventListener('click', () => {
      console.log('自动填充按钮被点击');
      window.gridInstance.fillEmptySpaces();
      
      // 自动填充后检测奖励单词
      setTimeout(async () => {
        try {
          await window.gridInstance.detectBonusWords();
        } catch (error) {
          console.error('自动检测奖励单词失败:', error);
        }
      }, 1000); // 等待填充完成后再检测
    });
  }
  
  // 检查重复单词按钮事件
  if (checkDuplicatesBtn) {
    checkDuplicatesBtn.addEventListener('click', () => {
      console.log('检查重复单词按钮被点击');
      
      try {
        // 使用网格实例的重复单词检查方法
        if (window.gridInstance && typeof window.gridInstance.checkDuplicateWords === 'function') {
          window.gridInstance.checkDuplicateWords();
          console.log('重复单词检查完成');
        } else {
          console.error('网格实例或重复单词检查方法不可用');
        }
      } catch (error) {
        console.error('检查重复单词时发生错误:', error);
      }
    });
  }
  
  // 生成关卡配置按钮事件 - 直接添加点击事件监听器
  if (generateLevelButton) {
    console.log('找到生成关卡按钮，绑定点击事件');
    generateLevelButton.addEventListener('click', async () => {
      console.log('生成关卡按钮被点击');
      try {
        await generateLevelConfig();
      } catch (error) {
        console.error('生成关卡配置失败:', error);
        showStatusMessage('生成关卡配置失败: ' + error.message, 'error');
      }
    });
  } else {
    console.error('未找到生成关卡按钮元素!');
  }
  
  // 检查API是否可用（支持Electron和Web版本）
  function checkElectronAPI() {
    if (!window.electronAPI) {
      console.error('API 不存在!');
      if (window.isWebVersion) {
        alert('无法连接到服务器，请确保服务器已启动');
      } else {
        alert('electronAPI不存在，应用可能无法保存文件。请检查控制台错误。');
      }
      return false;
    } else {
      const apiType = window.isWebVersion ? 'WebAPI' : 'ElectronAPI';
      console.log(`${apiType} 已加载，方法列表:`, Object.keys(window.electronAPI).join(', '));
      
      // 检查各个关键方法
      const methods = ['saveLevel', 'getSavedLevels', 'deleteLevel', 'generateLevel'];
      let allMethodsAvailable = true;
      
      methods.forEach(method => {
        if (typeof window.electronAPI[method] !== 'function') {
          console.error(`${apiType}.${method} 不是函数或不存在!`);
          allMethodsAvailable = false;
        } else {
          console.log(`${apiType}.${method} 可用`);
        }
      });
      
      return allMethodsAvailable;
    }
  }
  
  saveButton.addEventListener('click', async () => {
    try {
      console.log('保存按钮被点击');
      // 检查electronAPI和saveLevel方法
      if (!window.electronAPI) {
        console.error('保存失败: electronAPI 对象不存在');
        showStatusMessage('保存失败: electronAPI 对象不存在', 'error');
        return;
      }
      
      if (typeof window.electronAPI.saveLevel !== 'function') {
        console.error('保存失败: electronAPI.saveLevel 不是函数或不存在');
        showStatusMessage('保存失败: saveLevel 功能不可用', 'error');
        return;
      }
      
      // 获取关卡标题
      const title = levelTitleDisplay.textContent !== 'Word Search 关卡编辑器' ?
        levelTitleDisplay.textContent : editLevelTitleInput.value.trim();
      
      // 获取关卡等级
      const levelNumber = parseInt(editLevelNumberInput.value) || 1;
      
      // 获取关卡难度
      const difficultyInput = document.getElementById('edit-level-difficulty');
      const difficulty = parseInt(difficultyInput.value) || 0;
      
      // 获取Rads奖励状态
      const radsRewardCheckbox = document.getElementById('editor-has-rads-reward');
      const hasRadsReward = radsRewardCheckbox.checked;
      
      // 获取网格大小
      const gridSize = window.gridInstance.getGridSize();
      
      // 转换网格字母为一维数组格式
      const gridLetters = [];
      for (let row = 0; row < gridSize; row++) {
        let rowLetters = '';
        for (let col = 0; col < gridSize; col++) {
          rowLetters += window.gridInstance.getLetterAt(row, col) || ' ';
        }
        gridLetters.push(rowLetters);
      }
      
      // 创建关卡数据对象
      const levelData = {
        title: title,
        level: parseInt(levelNumber, 10) || 1,  // 确保level是数字
        grid: window.gridInstance.getGridData(),
        wordList: window.wordListInstance.getWordListData(),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      // 如果难度不为0，则添加难度字段
      if (difficulty > 0) {
        levelData.difficulty = difficulty;
        levelData.diff = difficulty; // 同时保存diff字段用于导出
      }
      
      // 如果启用了Rads奖励，则添加has_rads_reward字段
      if (hasRadsReward) {
        levelData.has_rads_reward = true;
      }
      
      // 检测bonus word并写入
      console.log('检测bonus words...');
      const bonusWords = await window.gridInstance.detectBonusWords();
      levelData.bonus = bonusWords.join(','); // 将奖励单词数组转换为逗号分隔的字符串
      console.log(`检测到 ${bonusWords.length} 个bonus words`);
      
      // 检查是否有特殊单词来确定关卡类型
      const gridData = window.gridInstance.getGridData();
      const hasGoldWords = gridData.placedWords.some(wordData => wordData.isGold);
      const hasBlackDotWords = gridData.placedWords.some(wordData => wordData.isBlackDot);
      
      // 根据特殊单词设置关卡类型
      let levelType = 1; // 默认普通关卡
      if (hasGoldWords) {
        levelType = 5; // 金币关
        console.log('检测到金币单词，设置关卡类型为金币关 (type=5)');
      } else if (hasBlackDotWords) {
        levelType = 7; // 黑点关
        console.log('检测到黑点单词，设置关卡类型为黑点关 (type=7)');
      }
      
      // 设置关卡类型
      levelData.type = levelType;
      
      // 如果是修改已有关卡，保留原ID
      if (window.currentLevelFilePath) {
        console.log('正在覆盖已有关卡:', window.currentLevelFilePath);
      } else {
        // 新建关卡，生成新ID
        levelData.id = 'WS' + Math.random().toString(36).substr(2, 6).toUpperCase();
        console.log('新建关卡，生成ID:', levelData.id);
      }
      
      console.log('准备保存关卡数据...');
      
      // 通过Electron IPC发送保存请求
      window.electronAPI.saveLevel(levelData, window.currentLevelFilePath)
        .then(result => {
          console.log('保存结果:', result);
          if (result.success) {
            const actionType = window.currentLevelFilePath ? '更新' : '创建';
            showStatusMessage(`关卡已${actionType}`, 'success');
            
            // 如果是新创建的关卡，保存文件路径以便后续编辑
            if (!window.currentLevelFilePath && result.filePath) {
              window.currentLevelFilePath = result.filePath;
              console.log('保存当前关卡路径:', window.currentLevelFilePath);
            }
            
            // 在编辑器中记录当前来源为关卡列表
            // 这样在点击返回按钮时，能正确返回到关卡列表并刷新
            if (window.navigation) {
              // 如果是从关卡列表进来的，保持sourcePageId为'levelList'
              if (window.navigation.sourcePageId !== 'levelList') {
                window.navigation.sourcePageId = 'levelConfig';
              }
            }
            
            // 通知自动保存管理器：手动保存成功
            if (window.autoSaveManager) {
              window.autoSaveManager.onManualSave();
            }
            
            // 触发关卡保存事件，用于刷新词频分析
            window.dispatchEvent(new CustomEvent('levelSaved', { detail: { filePath: result.filePath } }));
            
            // 刷新关卡导航列表
            if (window.levelNavigationManager) {
              window.levelNavigationManager.refreshLevelList();
            }
          } else {
            showStatusMessage(`保存失败: ${result.message}`, 'error');
          }
        })
        .catch(error => {
          console.error('保存时发生错误:', error);
          showStatusMessage(`保存失败: ${error.message}`, 'error');
        });
    } catch (e) {
      console.error('保存功能执行异常:', e);
      showStatusMessage(`保存失败: ${e.message}`, 'error');
    }
  });
  
  // 生成关卡配置的函数
  async function generateLevelConfig() {
    try {
      console.log('generateLevelConfig 函数已调用');
      // 获取当前网格数据和单词
      const gridData = window.gridInstance.getGridData();
      
      // 如果网格为空或没有放置单词，提示错误
      if (gridData.placedWords.length === 0) {
        showStatusMessage('请先放置一些单词到网格中', 'error');
        return;
      }
      
      // 获取标题
      const title = levelTitleDisplay.textContent !== 'Word Search 关卡编辑器' ?
        levelTitleDisplay.textContent : editLevelTitleInput.value.trim() || 'UNTITLED';
        
      // 获取关卡等级
      const levelNumber = parseInt(editLevelNumberInput.value) || 1;
      
      // 获取关卡难度
      const difficultyInput = document.getElementById('edit-level-difficulty');
      const difficulty = parseInt(difficultyInput.value) || 0;
      
      // 获取Rads奖励状态
      const radsRewardCheckbox = document.getElementById('editor-has-rads-reward');
      const hasRadsReward = radsRewardCheckbox.checked;
      
      // 转换网格字母为一维数组格式
      const gridLetters = [];
      for (let row = 0; row < gridData.height; row++) {
        let rowLetters = '';
        for (let col = 0; col < gridData.width; col++) {
          rowLetters += gridData.letters[row][col] || ' ';
        }
        gridLetters.push(rowLetters);
      }
      
      // 转换单词位置，包含特殊标记信息
      const words = gridData.placedWords.map(wordData => {
        // 获取单词起始和结束位置
        const startPos = wordData.positions[0];
        const endPos = wordData.positions[wordData.positions.length - 1];
        
        // 构建单词数据
        const wordInfo = {
          word: wordData.word,
          pos: `${startPos.row},${startPos.col};${endPos.row},${endPos.col}`
        };
        
        // 添加特殊标记信息
        if (wordData.isGold) {
          // 金币单词：从第0个字母到最后一个字母 (长度-1)
          wordInfo.coins = `0,${wordData.word.length - 1}`;
        } else if (wordData.isBlackDot) {
          // 黑点单词：从第0个字母到最后一个字母 (长度-1)
          wordInfo.point = `0,${wordData.word.length - 1}`;
        }
        
        return wordInfo;
      });
      
      // 检测bonus word并写入
      console.log('检测bonus words...');
      const bonusWords = await window.gridInstance.detectBonusWords();
      console.log(`检测到 ${bonusWords.length} 个bonus words`);
      
      // 检查是否有特殊单词来确定关卡类型
      const hasGoldWords = gridData.placedWords.some(wordData => wordData.isGold);
      const hasBlackDotWords = gridData.placedWords.some(wordData => wordData.isBlackDot);
      
      // 根据特殊单词设置关卡类型
      let levelType = 1; // 默认普通关卡
      if (hasGoldWords) {
        levelType = 5; // 金币关
        console.log('检测到金币单词，设置关卡类型为金币关 (type=5)');
      } else if (hasBlackDotWords) {
        levelType = 7; // 黑点关
        console.log('检测到黑点单词，设置关卡类型为黑点关 (type=7)');
      }
      
      // 创建关卡配置
      const levelConfig = {
        level: levelNumber, // 使用用户输入的关卡等级
        title: title,
        type: levelType, // 根据特殊单词动态设置类型
        grid: gridLetters,
        words: words,
        sentence: "", // 可选句子
        bonus: bonusWords.join(',') // 将奖励单词数组转换为逗号分隔的字符串
      };
      
      // 如果难度不为0，则添加diff字段
      if (difficulty > 0) {
        levelConfig.diff = difficulty;
        console.log(`添加难度字段: diff=${difficulty}`);
      }
      
      // 如果启用了Rads奖励，则添加has_rads_reward字段
      if (hasRadsReward) {
        levelConfig.has_rads_reward = true;
        console.log('添加Rads奖励字段: has_rads_reward=true');
      }
      
      // 如果是修改已有关卡，保留原ID
      if (window.currentLevelFilePath) {
        console.log('正在覆盖已有关卡:', window.currentLevelFilePath);
      } else {
        // 新建关卡，生成新ID
        levelConfig.id = 'WS' + Math.random().toString(36).substr(2, 6).toUpperCase();
        console.log('新建关卡，生成ID:', levelConfig.id);
      }
      
      // 显示生成的配置到控制台（调试用）
      console.log('生成的关卡配置:', levelConfig);
      
      // 检查electronAPI和generateLevel方法
      if (!window.electronAPI) {
        console.error('生成关卡失败: electronAPI 对象不存在');
        showStatusMessage('生成关卡失败: electronAPI 对象不存在', 'error');
        return;
      }
      
      if (typeof window.electronAPI.generateLevel !== 'function') {
        console.error('生成关卡失败: electronAPI.generateLevel 不是函数或不存在');
        showStatusMessage('生成关卡失败: generateLevel 功能不可用', 'error');
        return;
      }
      
      console.log('准备生成关卡配置...');
      
      // 使用generateLevel方法，允许用户选择保存位置
      window.electronAPI.generateLevel(levelConfig)
        .then(result => {
          console.log('generateLevel 返回结果:', result);
          if (result.success) {
            showStatusMessage(`关卡已生成并保存`, 'success');
          } else {
            showStatusMessage(`生成关卡失败: ${result.message}`, 'error');
          }
        })
        .catch(err => {
          console.error('generateLevel 出错:', err);
          showStatusMessage(`生成关卡失败: ${err.message}`, 'error');
        });
    } catch (error) {
      console.error('生成关卡配置时出错:', error);
      showStatusMessage(`生成关卡失败: ${error.message}`, 'error');
    }
  }
});

// 加载已保存的关卡
async function loadSavedLevels() {
  // 显示加载指示器
  showStatusMessage('正在加载已保存的关卡...', 'info');
  document.getElementById('saved-levels-container').innerHTML = '<div class="loading-indicator">加载中...</div>';
  
  try {
    // 调用Electron API获取已保存的关卡列表
    const levels = await window.electronAPI.getSavedLevels();
    
    // 如果没有找到关卡，显示提示信息
    if (!levels || levels.length === 0) {
      document.getElementById('saved-levels-container').innerHTML = '<div class="empty-message">没有找到已保存的关卡。</div>';
      showStatusMessage('没有找到已保存的关卡', 'info');
      return;
    }
    
    // 清空容器
    const container = document.getElementById('saved-levels-container');
    container.innerHTML = '';
    
    // 为每个关卡创建一个卡片
    levels.forEach(level => {
      // 添加调试信息
      console.log(`加载关卡: ${level.title || level.name || '未命名'}`, {
        hasLevel: !!level.level,
        levelType: typeof level.level,
        levelValue: level.level
      });
      
      const card = document.createElement('div');
      card.className = 'level-card';
      
      // 从文件名中提取关卡ID
      const fileNameMatch = level._filePath?.match(/level_([^\.]+)\.json$/);
      const levelIdFromFileName = fileNameMatch ? fileNameMatch[1] : '';
      
      // 标题使用关卡名称或ID
      const levelTitle = level.name || level.title || level.id || levelIdFromFileName || '未命名关卡';
      
      // 构建卡片HTML
      card.innerHTML = `
        <div class="level-header">
          <h3 class="level-title">
            ${escapeHTML(levelTitle)}
            ${level.level ? `<span class="level-badge">Level ${level.level}</span>` : ''}
            ${level._lastModifiedByName ? `<span class="editor-badge" title="最后编辑者">${escapeHTML(level._lastModifiedByName)}</span>` : (level._createdByName ? `<span class=\"editor-badge\" title=\"创建者\">${escapeHTML(level._createdByName)}</span>` : '')}
          </h3>
          <div class="level-buttons">
            <button class="edit-btn" title="编辑此关卡"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" title="删除此关卡"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="level-details">
          <p class="grid-size">网格大小: ${level.col || level.gridSize || '未知'} x ${level.row || level.gridSize || '未知'}</p>
          <p class="word-count">单词数量: ${level.words?.length || 0}</p>
          ${level.difficulty ? `<p class="difficulty">难度: ${level.difficulty}</p>` : ''}
          <p class="level-id">ID: ${level.id || levelIdFromFileName || '未知'}</p>
          ${level._createdByName ? `<p class="created-by">创建者: <span class="creator-name">${escapeHTML(level._createdByName)}</span></p>` : ''}
          ${level._lastModifiedByName ? `<p class="edited-by">最后编辑: <span class="editor-name">${escapeHTML(level._lastModifiedByName)}</span></p>` : ''}
          ${level.metadata?.createdAt ? `<p class="created-at">创建时间: ${new Date(level.metadata.createdAt).toLocaleString()}</p>` : ''}
          ${level._lastModified ? `<p class="modified-at">修改时间: ${new Date(level._lastModified).toLocaleString()}</p>` : ''}
        </div>
      `;
      
      // 添加点击事件处理程序
      card.querySelector('.edit-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        
        try {
          // 网页版不需要路径修正，直接使用文件名
          
          // 加载关卡到编辑器
          loadLevelIntoEditor(level);
          
          // 注意：currentLevelFilePath现在在loadLevelIntoEditor函数内部设置
          
          showStatusMessage(`已加载关卡: ${levelTitle}`, 'success');
          
          // 导航到编辑器页面
          if (window.navigation) {
            window.navigation.navigateTo('editor');
          }
        } catch (error) {
          console.error('加载关卡到编辑器时出错:', error);
          showStatusMessage(`加载关卡失败: ${error.message}`, 'error');
        }
      });
      
      // 添加删除按钮事件处理程序
      card.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        
        if (confirm(`确定要删除关卡 "${levelTitle}" 吗？此操作不可撤销。`)) {
          try {
            let filePath = level._filePath;
            
            // 网页版直接使用文件名
            
            // 调用删除API
            const result = await window.electronAPI.deleteLevel(filePath);
            
            if (result.success) {
              // 从DOM中移除卡片
              card.remove();
              showStatusMessage(`已删除关卡: ${levelTitle}`, 'success');
              
              // 如果删除的是当前编辑的关卡，清除filePath
              if (window.currentLevelFilePath === filePath) {
                window.currentLevelFilePath = null;
              }
            } else {
              throw new Error(result.message || '未知错误');
            }
          } catch (error) {
            console.error('删除关卡时出错:', error);
            showStatusMessage(`删除关卡失败: ${error.message}`, 'error');
          }
        }
      });
      
      // 将卡片添加到容器
      container.appendChild(card);
    });
    
    showStatusMessage(`已加载 ${levels.length} 个关卡`, 'success');
  } catch (error) {
    console.error('加载已保存关卡时出错:', error);
    document.getElementById('saved-levels-container').innerHTML = 
      `<div class="error-message">加载关卡时出错: ${error.message}</div>`;
    showStatusMessage(`加载关卡失败: ${error.message}`, 'error');
  }
}



// 加载关卡到编辑器
window.loadLevelIntoEditor = function(levelData) {
  try {
    console.log('开始加载关卡数据到编辑器:', levelData);
    
    // 首先设置当前关卡文件路径
    if (levelData._filePath) {
      window.currentLevelFilePath = levelData._filePath;
      console.log('在loadLevelIntoEditor中设置currentLevelFilePath:', window.currentLevelFilePath);
    }
    
    // 设置来源页面为关卡列表页面
    // 这样当用户点击返回按钮时，可以正确返回到关卡列表页面并刷新数据
    if (window.navigation) {
      window.navigation.sourcePageId = 'levelList';
      console.log('设置来源页面为关卡列表');
    }
    
    // 如果是从关卡列表加载，激活关卡导航功能
    console.log('loadLevelIntoEditor: 检查levelNavigationManager存在性:', !!window.levelNavigationManager);
    if (window.levelNavigationManager) {
      console.log('loadLevelIntoEditor: 准备调用setLevelList');
      // 等待DOM更新后再设置关卡列表
      setTimeout(() => {
        console.log('loadLevelIntoEditor: 开始调用setLevelList(true)');
        window.levelNavigationManager.setLevelList(true);
      }, 100);
    } else {
      console.error('loadLevelIntoEditor: levelNavigationManager 不存在!');
    }
    
    // 获取必要的DOM元素
    const gridInstance = window.gridInstance;
    const titleInput = document.getElementById('edit-level-title');
    const levelNumberInput = document.getElementById('edit-level-number');
    const difficultyInput = document.getElementById('edit-level-difficulty');
    const radsRewardCheckbox = document.getElementById('editor-has-rads-reward');
    const titleDisplay = document.getElementById('level-title-display');
    
    // 设置关卡标题
    const title = levelData.title || levelData.name || '';
    titleInput.value = title;
    titleDisplay.textContent = title || 'Word Search 关卡编辑器';
    
    // 设置关卡等级（如果存在）
    if (levelData.level) {
      levelNumberInput.value = levelData.level;
    } else {
      levelNumberInput.value = ''; // 默认为空，而不是设置为1
    }
    
    // 设置关卡难度（优先使用diff字段，兼容difficulty字段和hard字段）
    const diffValue = levelData.diff || levelData.hard || levelData.difficulty || 0;
    if (diffValue > 0) {
      difficultyInput.value = diffValue;
      console.log(`加载关卡难度: ${diffValue}`);
    } else {
      difficultyInput.value = 0; // 默认为0
    }
    
    // 设置Rads奖励状态（如果存在）
    if (levelData.has_rads_reward) {
      radsRewardCheckbox.checked = true;
      console.log('加载Rads奖励状态: true');
    } else {
      radsRewardCheckbox.checked = false; // 默认为false
    }
    
    // 加载网格数据
    if (levelData.grid) {
      // 处理不同的网格数据格式
      let gridData = levelData.grid;
      
      // 如果网格数据是字符串数组，转换为二维数组
      if (Array.isArray(gridData) && typeof gridData[0] === 'string') {
        console.log('从字符串数组转换为二维数组:', gridData);
        // 确保空格字符会被正确显示
        gridData = gridData.map(row => {
          return row.split('').map(letter => letter === ' ' ? '' : letter);
        });
      }
      
      // 如果存在已预处理的网格数据
      if (levelData.grid && levelData.grid.letters) {
        gridData = levelData.grid.letters;
      }
      
      // 设置网格大小
      const height = gridData.length;
      const width = gridData[0].length || gridData[0].split('').length;
      gridInstance.setSize(width, height);
      
      // 更新网格大小显示
      document.getElementById('grid-size-display').textContent = `${width}x${height}`;
      
      // 加载字母数据
      gridInstance.loadGridLetters(gridData);
      
      console.log('已加载网格数据');
    }
    
    // 加载已放置的单词
    let wordsToLoad = [];
    
    // 优先使用 grid.placedWords（包含特殊标记），如果不存在则使用 words 数组
    if (levelData.grid && levelData.grid.placedWords && Array.isArray(levelData.grid.placedWords)) {
      wordsToLoad = levelData.grid.placedWords;
      console.log('从 grid.placedWords 加载单词列表:', wordsToLoad.length, '个单词');
    } else if (levelData.words && Array.isArray(levelData.words)) {
      wordsToLoad = levelData.words;
      console.log('从 words 数组加载单词列表:', wordsToLoad.length, '个单词');
    }
    
    if (wordsToLoad.length > 0) {
      console.log('加载放置单词:', wordsToLoad);
      
      // 处理每个单词
      wordsToLoad.forEach((wordData, index) => {
        try {
          let word, startRow, startCol, direction, isGold = false, isBlackDot = false;
          
          if (wordData.positions && Array.isArray(wordData.positions)) {
            // 格式1: grid.placedWords 格式 (包含 positions 数组)
            word = wordData.word;
            const startPos = wordData.positions[0];
            const endPos = wordData.positions[wordData.positions.length - 1];
            
            startRow = startPos.row;
            startCol = startPos.col;
            
            // 检查特殊标记 (使用 isGold/isBlackDot 字段)
            isGold = !!wordData.isGold;
            isBlackDot = !!wordData.isBlackDot;
            
            // 根据首尾位置确定方向
            const endRow = endPos.row;
            const endCol = endPos.col;
            
            if (startRow === endRow && startCol < endCol) direction = 'horizontal';
            else if (startRow === endRow && startCol > endCol) direction = 'reverseHorizontal';
            else if (startCol === endCol && startRow < endRow) direction = 'vertical';
            else if (startCol === endCol && startRow > endRow) direction = 'reverseVertical';
            else if (startRow < endRow && startCol < endCol) direction = 'diagonal';
            else if (startRow < endRow && startCol > endCol) direction = 'reverseDiagonal';
            else if (startRow > endRow && startCol < endCol) direction = 'diagonalUp';
            else if (startRow > endRow && startCol > endCol) direction = 'reverseDiagonalUp';
            else direction = 'horizontal'; // 默认
            
          } else if (wordData.pos) {
            // 格式2: words 数组格式 (包含 pos 字符串)
            word = wordData.word;
            const [startPos, endPos] = wordData.pos.split(';');
            if (!startPos || !endPos) return;
            
            [startRow, startCol] = startPos.split(',').map(Number);
            const [endRow, endCol] = endPos.split(',').map(Number);
            
            // 检查特殊标记 (使用 coins/point 字段)
            isGold = !!wordData.coins;
            isBlackDot = !!wordData.point;
            
            // 根据首尾位置确定方向
            if (startRow === endRow && startCol < endCol) direction = 'horizontal';
            else if (startRow === endRow && startCol > endCol) direction = 'reverseHorizontal';
            else if (startCol === endCol && startRow < endRow) direction = 'vertical';
            else if (startCol === endCol && startRow > endRow) direction = 'reverseVertical';
            else if (startRow < endRow && startCol < endCol) direction = 'diagonal';
            else if (startRow < endRow && startCol > endCol) direction = 'reverseDiagonal';
            else if (startRow > endRow && startCol < endCol) direction = 'diagonalUp';
            else if (startRow > endRow && startCol > endCol) direction = 'reverseDiagonalUp';
            else direction = 'horizontal'; // 默认
          } else {
            console.warn(`跳过无效的单词数据 ${index}:`, wordData);
            return;
          }
          
          console.log(`单词 ${word} 特殊属性: 金币关=${isGold}, 黑点关=${isBlackDot}`);
          
          // 放置单词，并传递特殊属性
          const success = gridInstance.placeWord(word, startRow, startCol, direction, true);
          
          if (success && (isGold || isBlackDot)) {
            // 查找刚放置的单词并设置特殊属性
            const placedWord = gridInstance.placedWords.find(pw => 
              pw.word === word && 
              pw.positions[0].row === startRow && 
              pw.positions[0].col === startCol
            );
            
            if (placedWord) {
              placedWord.isGold = isGold;
              placedWord.isBlackDot = isBlackDot;
              console.log(`已设置单词 ${word} 的特殊属性: isGold=${isGold}, isBlackDot=${isBlackDot}`);
            }
          }
          
          console.log(`已放置单词: ${word} 在 (${startRow},${startCol}) 方向 ${direction}`);
        } catch (error) {
          console.error(`处理单词时出错:`, error, wordData);
        }
      });
      
      console.log(`成功加载 ${wordsToLoad.length} 个已放置单词`);
    }
    
    // 加载奖励单词，如果有
    if (levelData.bonus) {
      // 处理不同的bonus字段格式（字符串或数组）
      let bonusWords = levelData.bonus;
      
      // 如果bonus是字符串，转换为数组
      if (typeof bonusWords === 'string') {
        bonusWords = bonusWords.split(',').filter(word => word.trim());
        console.log('从字符串转换bonus words为数组:', bonusWords);
      }
      
      gridInstance.setBonusWords(bonusWords);
      console.log(`已加载 ${bonusWords.length} 个奖励单词`);
    }
    
    // 同步单词列表到编辑器界面
    if (window.wordListInstance && wordsToLoad.length > 0) {
      // 从已放置的单词中构建单词列表数据
      const wordListData = {
        words: wordsToLoad.map(wordData => {
          let word, isGold = false, isBlackDot = false;
          
          if (wordData.positions && Array.isArray(wordData.positions)) {
            // 格式1: grid.placedWords 格式
            word = wordData.word;
            isGold = !!wordData.isGold;
            isBlackDot = !!wordData.isBlackDot;
          } else if (wordData.pos) {
            // 格式2: words 数组格式
            word = wordData.word;
            isGold = !!wordData.coins;
            isBlackDot = !!wordData.point;
          } else {
            return null; // 跳过无效数据
          }
          
          return {
            word: word,
            isGold: isGold,
            isBlackDot: isBlackDot,
            positioned: true // 标记为已放置
          };
        }).filter(Boolean) // 过滤掉 null 值
      };
      
      console.log('加载单词列表到界面:', wordListData);
      
      // 为了兼容性，同时传递字符串数组给WordList
      const stringWordListData = {
        words: wordListData.words.map(item => item.word)
      };
      
      window.wordListInstance.loadFromData(stringWordListData);
    }
    
    // 触发网格更新（确保所有视觉效果正确显示）
    if (gridInstance.triggerGridChangeEvent) {
      gridInstance.triggerGridChangeEvent();
    }
    
    // 检查当前关卡是否有特殊单词，自动设置相关开关状态
    setTimeout(() => {
      if (gridInstance && gridInstance.placedWords) {
        const hasGoldWords = gridInstance.placedWords.some(word => word.isGold);
        const hasBlackDotWords = gridInstance.placedWords.some(word => word.isBlackDot);
        
        console.log(`关卡中特殊单词统计: 金币关=${hasGoldWords}, 黑点关=${hasBlackDotWords}`);
        
        // 设置金币关复选框（编辑器页面使用editor-前缀）
        const goldCheckbox = document.getElementById('editor-gold-level') || document.getElementById('gold-level');
        if (goldCheckbox) {
          goldCheckbox.checked = hasGoldWords;
          console.log(`设置金币关复选框: ${hasGoldWords} (ID: ${goldCheckbox.id})`);
        } else {
          console.warn('未找到金币关复选框');
        }
        
        // 设置黑点关复选框（编辑器页面使用editor-前缀）
        const blackDotCheckbox = document.getElementById('editor-black-dot-level') || document.getElementById('black-dot-level');
        if (blackDotCheckbox) {
          blackDotCheckbox.checked = hasBlackDotWords;
          console.log(`设置黑点关复选框: ${hasBlackDotWords} (ID: ${blackDotCheckbox.id})`);
        } else {
          console.warn('未找到黑点关复选框');
        }
        
        // 设置特殊单词预览开关
        const toggle = document.getElementById('special-words-preview');
        if (toggle && (hasGoldWords || hasBlackDotWords) && !toggle.checked) {
          toggle.checked = true;
          console.log('发现特殊单词，自动勾选特殊单词预览开关');
        }
      }
    }, 100);
    
    console.log('关卡加载完成');
    
    // 重置自动保存状态（因为刚加载的关卡是已保存状态）
    if (window.autoSaveManager) {
      window.autoSaveManager.markAsSaved();
      console.log('✅ 已重置自动保存状态为"已保存"');
    }
  } catch (error) {
    console.error('加载关卡到编辑器时发生错误:', error);
    showStatusMessage(`加载关卡失败: ${error.message}`, 'error');
  }
}

// 初始化帮助模态框函数
function initHelpModal() {
  const helpModal = document.getElementById('help-modal');
  const helpBtn = document.getElementById('help-btn');
  const closeBtn = helpModal.querySelector('.close-modal');
  
  // 点击帮助按钮打开模态框
  helpBtn.addEventListener('click', () => {
    helpModal.classList.add('active');
  });
  
  // 点击关闭按钮关闭模态框
  closeBtn.addEventListener('click', () => {
    helpModal.classList.remove('active');
  });
  
  // 点击模态框外部关闭模态框
  helpModal.addEventListener('click', (event) => {
    if (event.target === helpModal) {
      helpModal.classList.remove('active');
    }
  });
  

}

// 网格大小管理辅助函数
function updateGridSizeInputs() {
  const widthInput = document.getElementById('width-input');
  const heightInput = document.getElementById('height-input');
  
  if (widthInput && window.gridInstance) {
    widthInput.value = window.gridInstance.width;
  }
  
  if (heightInput && window.gridInstance) {
    heightInput.value = window.gridInstance.height;
  }
}

function setGridWidth(newWidth) {
  if (!window.gridInstance || newWidth < 5 || newWidth > 20) return;
  
  const currentWidth = window.gridInstance.width;
  
  if (newWidth > currentWidth) {
    // 增加宽度
    for (let i = currentWidth; i < newWidth; i++) {
      if (!window.gridInstance.increaseWidth()) break;
    }
  } else if (newWidth < currentWidth) {
    // 减少宽度
    for (let i = currentWidth; i > newWidth; i--) {
      if (!window.gridInstance.decreaseWidth()) break;
    }
  }
  
  updateGridSizeInputs();
}

function setGridHeight(newHeight) {
  if (!window.gridInstance || newHeight < 5 || newHeight > 20) return;
  
  const currentHeight = window.gridInstance.height;
  
  if (newHeight > currentHeight) {
    // 增加高度
    for (let i = currentHeight; i < newHeight; i++) {
      if (!window.gridInstance.increaseHeight()) break;
    }
  } else if (newHeight < currentHeight) {
    // 减少高度
    for (let i = currentHeight; i > newHeight; i--) {
      if (!window.gridInstance.decreaseHeight()) break;
    }
  }
  
  updateGridSizeInputs();
}

// 统一的模态框ESC键处理器
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    // 查找当前激活的模态框并关闭它
    const activeModals = document.querySelectorAll('.modal.active, #word-frequency-modal.active, #bonus-words-modal.active');
    activeModals.forEach(modal => {
      modal.classList.remove('active');
      // 如果是奖励单词模态框，还需要恢复body的滚动
      if (modal.id === 'bonus-words-modal') {
        document.body.style.overflow = '';
      }
    });
  }
});

// 用户管理功能
class UserManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  async init() {
    // 检查是否已登录
    await this.checkAuthStatus();
    this.bindEvents();
  }

  async checkAuthStatus() {
    try {
      if (window.electronAPI && window.electronAPI.getCurrentUser) {
        // Electron环境
        this.currentUser = await window.electronAPI.getCurrentUser();
      } else if (window.webAPI) {
        // Web环境
        this.currentUser = await window.webAPI.getCurrentUser();
      }

      if (this.currentUser) {
        this.showUserInfo();
      } else {
        this.hideUserInfo();
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
      this.hideUserInfo();
    }
  }

  showUserInfo() {
    const userInfoBar = document.getElementById('user-info-bar');
    const displayName = document.getElementById('user-display-name');
    const userRole = document.getElementById('user-role');

    if (userInfoBar && this.currentUser) {
      displayName.textContent = this.currentUser.displayName || this.currentUser.username;
      userRole.textContent = this.getRoleDisplayName(this.currentUser.role);
      userInfoBar.style.display = 'block';
    }
  }

  hideUserInfo() {
    const userInfoBar = document.getElementById('user-info-bar');
    if (userInfoBar) {
      userInfoBar.style.display = 'none';
    }
  }

  getRoleDisplayName(role) {
    const roleMap = {
      'admin': '管理员',
      'editor': '编辑员',
      'viewer': '查看者',
      'user': '用户'
    };
    return roleMap[role] || role;
  }

  bindEvents() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.logout();
      });
    }
  }

  async logout() {
    try {
      console.log('开始登出流程...');
      
      // 清除用户信息
      this.currentUser = null;
      this.hideUserInfo();
      
      // 在Web环境下执行登出
      if (window.isWebVersion || window.webAPI) {
        try {
          if (window.webAPI && window.webAPI.logout) {
            await window.webAPI.logout();
          } else if (window.electronAPI && window.electronAPI.logout) {
            await window.electronAPI.logout();
          }
          console.log('服务器登出成功');
        } catch (error) {
          console.warn('服务器登出失败，但继续本地登出:', error);
        }
        
        // 清除本地会话信息
        localStorage.removeItem('sessionId');
        
        // 强制跳转到登录页面
        console.log('跳转到登录页面...');
        window.location.href = '/login.html';
      } else {
        // Electron环境
        if (window.electronAPI && window.electronAPI.logout) {
          await window.electronAPI.logout();
        }
      }
    } catch (error) {
      console.error('登出失败:', error);
      
      // 即使出错也尝试清除本地状态并跳转
      if (window.isWebVersion) {
        localStorage.removeItem('sessionId');
        window.location.href = '/login.html';
      } else {
        alert('登出失败，请稍后重试');
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

// 初始化用户管理器
let userManager;
document.addEventListener('DOMContentLoaded', () => {
  userManager = new UserManager();
});