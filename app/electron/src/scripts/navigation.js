// 页面导航管理
class Navigation {
  constructor() {
    this.pages = {
      home: document.getElementById('home-page'),
      levelConfig: document.getElementById('level-config-page'),
      editor: document.getElementById('editor-page'),
      levelList: document.getElementById('level-list-page'),
      simpleEditor: null, // 将在renderSimpleEditor中创建
      replicaEditor: null, // 将在renderReplicaEditor中创建
      singleWordsetEditor: null, // 将在renderSingleWordsetEditor中创建
      singleWordsetPreview: null // 将在renderSingleWordsetPreview中创建
    };
    
    this.currentPage = 'home';
    
    // 添加来源页面跟踪属性 
    this.sourcePageId = 'home';
    
    // 保存当前排序状态
    this.sortConfig = {
      field: 'createdAt', // 默认按创建时间排序
      order: 'desc'       // 默认降序（新到旧）
    };
    
    // 保存关卡列表数据，方便排序
    this.levelsData = [];
    
    // 绑定导航事件
    this.bindEvents();
  }
  
  // 绑定按钮事件
  bindEvents() {
    // 从首页到配置页面
    document.getElementById('manual-edit-btn').addEventListener('click', () => {
      this.navigateTo('levelConfig');
    });
    
    // 从首页到关卡列表页面
    document.getElementById('load-level-btn').addEventListener('click', () => {
      this.navigateTo('levelList');
      // 加载关卡列表
      this.loadLevelList();
    });
    
    // 普通关卡编辑按钮
    document.getElementById('simple-edit-btn').addEventListener('click', () => {
      this.renderSimpleEditor();
      this.navigateTo('simpleEditor');
    });
    
    // 关卡复刻按钮
    document.getElementById('replica-edit-btn').addEventListener('click', () => {
      this.renderReplicaEditor();
      this.navigateTo('replicaEditor');
    });
    
    // 指定单词关卡按钮
    document.getElementById('single-wordset-btn').addEventListener('click', () => {
      this.renderSingleWordsetEditor();
      this.navigateTo('singleWordsetEditor');
    });
    
    // 从关卡列表页面返回首页
    document.getElementById('back-to-home').addEventListener('click', () => {
      this.navigateTo('home');
    });
    
    // 打开配置文件夹按钮
    document.getElementById('open-config-folder-btn').addEventListener('click', () => {
      this.openConfigFolder();
    });
    
    // 批量导出相关事件
    this.initBatchExportEvents();
    
    // 从配置页面返回首页
    document.getElementById('config-back-to-home').addEventListener('click', () => {
      this.navigateTo('home');
    });
    
    // 从配置页面到编辑器页面
    document.getElementById('create-level-btn').addEventListener('click', () => {
      if (this.validateLevelConfig()) {
        this.resetEditorState(); // 新建关卡前先清空编辑器状态
        // 记录来源页面
        this.sourcePageId = 'levelConfig';
        this.navigateTo('editor');
        this.applyLevelConfig();
      }
    });
    
    // 导入配置按钮
    document.getElementById('import-config-btn').addEventListener('click', () => {
      this.importConfig();
    });
    
    // 绑定编辑器页面特殊选项的变化事件
    this.bindEditorSpecialOptions();
    
    // 从编辑器页面返回上一页
    const backButton = document.getElementById('back-to-config');
    // 检查按钮是否已经绑定过事件
    if (backButton && !backButton.hasEventListener) {
      backButton.hasEventListener = true;
      backButton.addEventListener('click', () => {
        if (confirm('返回将丢失当前未保存的编辑内容，是否继续？')) {
          window.currentLevelFilePath = null;
          
          // 根据来源页面决定返回的页面
          if (this.lastEditorSource === 'singleWordset') {
            this.navigateTo('singleWordsetEditor');
          } else if (this.lastEditorSource === 'simpleBatchPreview') {
            // 回到批量关卡预览
            this.simpleEditorState.stage = 'preview';
            this.navigateTo('simpleEditor');
            this.updateSimpleEditorUI();
          } else if (this.sourcePageId === 'levelList') {
            // 返回关卡列表页面并刷新
            this.goToLevelListPage();
          } else {
            // 默认返回配置页面
            this.navigateTo('levelConfig');
          }
        }
      });
    }
  }
  
  // 加载关卡列表
  loadLevelList() {
    const levelListElement = document.getElementById('level-list');
    
    // 清空列表
    levelListElement.innerHTML = '';
    
    // 通过Electron API获取保存的关卡列表
    if (window.electronAPI && window.electronAPI.getSavedLevels) {
      window.electronAPI.getSavedLevels()
        .then(levels => {
          if (levels && levels.length > 0) {
            // 保存关卡数据
            this.levelsData = levels;
            
            // 排序关卡列表
            this.sortLevels();
            
            // 有保存的关卡，创建列表项
            this.levelsData.forEach(level => {
              const levelItem = this.createLevelItem(level);
              levelListElement.appendChild(levelItem);
            });
            
            // 绑定排序下拉菜单事件
            this.bindSortDropdown();
            

          } else {
            // 没有保存的关卡，显示提示信息
            const noLevelsMessage = document.createElement('div');
            noLevelsMessage.className = 'no-levels-message';
            noLevelsMessage.textContent = '暂无保存的关卡';
            levelListElement.appendChild(noLevelsMessage);
          }
        })
        .catch(error => {
          console.error('获取关卡列表失败:', error);
          showStatusMessage('获取关卡列表失败: ' + error.message, 'error');
          
          // 显示错误信息
          const errorMessage = document.createElement('div');
          errorMessage.className = 'no-levels-message';
          errorMessage.textContent = '无法加载关卡列表，请检查控制台错误';
          levelListElement.appendChild(errorMessage);
        });
    } else {
      console.error('getSavedLevels API不存在');
      
      // 显示API不可用的信息
      const apiErrorMessage = document.createElement('div');
      apiErrorMessage.className = 'no-levels-message';
      apiErrorMessage.textContent = '关卡加载功能不可用';
      levelListElement.appendChild(apiErrorMessage);
    }
  }
  
  // 绑定排序下拉菜单事件
  bindSortDropdown() {
    const sortSelect = document.getElementById('level-sort-select');
    if (!sortSelect) return;
    
    // 设置下拉菜单初始值
    const { field, order } = this.sortConfig;
    const value = `${field}-${order}`;
    sortSelect.value = value;
    
    // 添加change事件
    sortSelect.addEventListener('change', () => {
      const selectedValue = sortSelect.value;
      const [field, order] = selectedValue.split('-');
      
      // 更新排序配置
      this.sortConfig = { field, order };
      
      // 重新排序并显示
      this.sortLevels();
      
      // 清空并重新填充列表
      const levelListElement = document.getElementById('level-list');
      levelListElement.innerHTML = '';
      
      this.levelsData.forEach(level => {
        const levelItem = this.createLevelItem(level);
        levelListElement.appendChild(levelItem);
      });
    });
  }
  
  // 根据当前排序配置对关卡进行排序
  sortLevels() {
    if (!this.levelsData || this.levelsData.length === 0) return;
    
    const { field, order } = this.sortConfig;
    
    this.levelsData.sort((a, b) => {
      let valueA, valueB;
      
      // 根据字段获取排序值
      if (field === 'level') {
        // 将字符串转为数字进行比较，确保undefined或null转为0
        valueA = parseInt(a.level, 10) || 0;
        valueB = parseInt(b.level, 10) || 0;
      } else if (field === 'createdAt') {
        // 直接使用文件系统时间进行排序
        valueA = a._lastModified ? new Date(a._lastModified).getTime() : 0;
        valueB = b._lastModified ? new Date(b._lastModified).getTime() : 0;
      } else {
        // 默认使用标题
        valueA = (a.title || '').toLowerCase();
        valueB = (b.title || '').toLowerCase();
      }
      
      // 根据排序方向返回比较结果
      if (order === 'asc') {
        return valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
      } else {
        return valueA < valueB ? 1 : (valueA > valueB ? -1 : 0);
      }
    });
  }
  
  // 创建关卡列表项
  createLevelItem(levelData) {
    const item = document.createElement('div');
    item.className = 'level-item';
    
    // 创建关卡信息区域
    const infoDiv = document.createElement('div');
    infoDiv.className = 'level-info';
    
    // 关卡标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'level-title';
    
    // 添加关卡标题和关卡等级徽章
    titleDiv.innerHTML = `
      ${levelData.title || 'Untitled Level'}
      ${levelData.level ? `<span class="level-badge">Level ${levelData.level}</span>` : ''}
    `;
    
    infoDiv.appendChild(titleDiv);
    
    // 关卡元数据
    const metaDiv = document.createElement('div');
    metaDiv.className = 'level-metadata';
    
    // 创建时间 - 优先使用createdAt，然后使用_lastModified
    const timeField = levelData.createdAt || levelData.lastModifiedAt || levelData._lastModified;
    if (timeField) {
      const date = new Date(timeField);
      metaDiv.textContent = `创建于: ${date.toLocaleString()}`;
    }
    
    // 网格大小
    if (levelData.grid && levelData.grid.width && levelData.grid.height) {
      metaDiv.textContent += ` | 大小: ${levelData.grid.width}x${levelData.grid.height}`;
    }
    
    // 单词数量
    if (levelData.wordList && levelData.wordList.words) {
      metaDiv.textContent += ` | 单词数: ${levelData.wordList.words.length}`;
    } else if (levelData.words) {
      // 兼容不同格式的关卡数据
      metaDiv.textContent += ` | 单词数: ${levelData.words.length}`;
    }
    
    // 显示关卡等级（如果没有添加到标题中）
    if (!levelData.level && metaDiv.textContent) {
      metaDiv.textContent += ' | Level: 1';
    }
    
    infoDiv.appendChild(metaDiv);
    
    // 创建操作按钮区域
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'level-actions';
    
    // 编辑按钮
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.className = 'primary-btn';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止冒泡
      this.loadLevelForEditing(levelData);
    });
    actionsDiv.appendChild(editBtn);
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.className = 'secondary-btn delete-btn';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止冒泡
      this.deleteLevel(levelData);
    });
    actionsDiv.appendChild(deleteBtn);
    
    // 将信息区域和操作区域添加到列表项
    item.appendChild(infoDiv);
    item.appendChild(actionsDiv);
    
    // 整个列表项点击也可以编辑
    item.addEventListener('click', () => {
      this.loadLevelForEditing(levelData);
    });
    
    return item;
  }
  
  // 加载关卡数据进入编辑器
  loadLevelForEditing(levelData, skipNavigationSetup = false) {
    // 记录来源页面是关卡列表
    this.sourcePageId = 'levelList';
    
    // 清理之前的拖拽状态
    if (window.wordListInstance && typeof window.wordListInstance.clearDragState === 'function') {
      window.wordListInstance.clearDragState();
    }
    
    // 导航到编辑器页面
    this.navigateTo('editor');
    
    // 激活关卡导航功能（仅在首次进入时设置）
    if (!skipNavigationSetup) {
      console.log('loadLevelForEditing: 准备激活关卡导航功能');
      if (window.levelNavigationManager) {
        console.log('loadLevelForEditing: 调用setLevelList激活导航');
        setTimeout(() => {
          window.levelNavigationManager.setLevelList(true);
        }, 100);
      } else {
        console.error('loadLevelForEditing: levelNavigationManager 不存在!');
      }
    } else {
      console.log('loadLevelForEditing: 跳过导航设置（来自导航切换）');
    }
    
    // 更新标题显示
    const displayTitle = levelData.title || 'Word Search 关卡编辑器';
    document.getElementById('level-title-display').textContent = displayTitle;
    
    // 更新编辑标题输入框
    const editTitleInput = document.getElementById('edit-level-title');
    if (editTitleInput) {
      editTitleInput.value = levelData.title || '';
    }
    
    // 更新关卡等级输入框
    const editLevelNumberInput = document.getElementById('edit-level-number');
    if (editLevelNumberInput) {
      if (levelData.level) {
        editLevelNumberInput.value = levelData.level;
      } else {
        editLevelNumberInput.value = ''; // 如果关卡文件中没有level值，则设为空
      }
    }
    
    // 更新网格大小显示
    if (levelData.grid) {
      document.getElementById('grid-size-display').textContent = 
        `${levelData.grid.width}x${levelData.grid.height}`;
      
      // 设置网格大小并加载数据
      window.gridInstance.setSize(levelData.grid.width, levelData.grid.height);
      window.gridInstance.loadFromData(levelData.grid);
    }
    
    // 加载单词列表数据
    if (levelData.wordList && window.wordListInstance) {
      window.wordListInstance.loadFromData(levelData.wordList);
    }
    
    // 保存原始文件路径，以便后续可以覆盖同一文件
    if (levelData._filePath) {
      window.currentLevelFilePath = levelData._filePath;
      console.log('设置当前关卡文件路径:', window.currentLevelFilePath);
    }
    
    // 根据关卡中的特殊单词自动设置复选框状态
    setTimeout(() => {
      if (window.gridInstance && window.gridInstance.placedWords) {
        const hasGoldWords = window.gridInstance.placedWords.some(word => word.isGold);
        const hasBlackDotWords = window.gridInstance.placedWords.some(word => word.isBlackDot);
        
        console.log(`loadLevelForEditing: 特殊单词统计: 金币关=${hasGoldWords}, 黑点关=${hasBlackDotWords}`);
        
        // 设置金币关复选框（编辑器页面使用editor-前缀）
        const goldCheckbox = document.getElementById('editor-gold-level') || document.getElementById('gold-level');
        if (goldCheckbox) {
          goldCheckbox.checked = hasGoldWords;
          console.log(`loadLevelForEditing: 设置金币关复选框: ${hasGoldWords} (ID: ${goldCheckbox.id})`);
        } else {
          console.warn('loadLevelForEditing: 未找到金币关复选框');
        }
        
        // 设置黑点关复选框（编辑器页面使用editor-前缀）
        const blackDotCheckbox = document.getElementById('editor-black-dot-level') || document.getElementById('black-dot-level');
        if (blackDotCheckbox) {
          blackDotCheckbox.checked = hasBlackDotWords;
          console.log(`loadLevelForEditing: 设置黑点关复选框: ${hasBlackDotWords} (ID: ${blackDotCheckbox.id})`);
        } else {
          console.warn('loadLevelForEditing: 未找到黑点关复选框');
        }
        
        // 设置特殊单词预览开关
        const toggle = document.getElementById('special-words-preview');
        if (toggle && (hasGoldWords || hasBlackDotWords) && !toggle.checked) {
          toggle.checked = true;
          console.log('loadLevelForEditing: 发现特殊单词，自动勾选特殊单词预览开关');
        }
        
        // 设置关卡难度值
        const difficultyInput = document.getElementById('edit-level-difficulty');
        if (difficultyInput) {
          const difficulty = levelData.difficulty || 0;
          difficultyInput.value = difficulty;
          console.log(`loadLevelForEditing: 设置关卡难度: ${difficulty}`);
        }
        
        // 设置Rads奖励状态
        const radsRewardCheckbox = document.getElementById('editor-has-rads-reward');
        if (radsRewardCheckbox) {
          radsRewardCheckbox.checked = !!levelData.has_rads_reward;
          console.log(`loadLevelForEditing: 设置Rads奖励状态: ${!!levelData.has_rads_reward}`);
        }
      }
    }, 200); // 给更多时间让网格数据加载完成
    
    showStatusMessage(`已加载关卡: ${displayTitle}`);
  }
  
  // 删除关卡
  deleteLevel(levelData) {
    if (!levelData || !levelData._filePath) {
      showStatusMessage('无法删除关卡：缺少文件路径', 'error');
      return;
    }
    
    if (confirm(`确定要删除关卡"${levelData.title || 'Untitled'}"吗？此操作不可撤销。`)) {
      if (window.electronAPI && window.electronAPI.deleteLevel) {
        window.electronAPI.deleteLevel(levelData._filePath)
          .then(result => {
            if (result.success) {
              showStatusMessage('关卡已删除');
              // 从levelsData数组中删除关卡
              if (this.levelsData && this.levelsData.length > 0) {
                this.levelsData = this.levelsData.filter(level => 
                  level._filePath !== levelData._filePath
                );
              }
              // 刷新关卡列表
              this.loadLevelList();
            } else {
              showStatusMessage(`删除失败: ${result.message}`, 'error');
            }
          })
          .catch(error => {
            console.error('删除关卡时出错:', error);
            showStatusMessage(`删除失败: ${error.message}`, 'error');
          });
      } else {
        console.error('deleteLevel API不存在');
        showStatusMessage('删除功能不可用', 'error');
      }
    }
  }
  
  // 验证关卡配置
  validateLevelConfig() {
    const width = parseInt(document.getElementById('grid-width').value, 10);
    const height = parseInt(document.getElementById('grid-height').value, 10);
    
    // 标题不再是必填项
    
    if (isNaN(width) || width < 5 || width > 20) {
      showStatusMessage('网格宽度必须在5到20之间', 'error');
      return false;
    }
    
    if (isNaN(height) || height < 5 || height > 20) {
      showStatusMessage('网格高度必须在5到20之间', 'error');
      return false;
    }
    
    return true;
  }
  
  // 验证导入的关卡配置
  validateImportedLevelConfig(levelData) {
    console.log('验证关卡数据:', levelData);
    
    // 检查基本结构
    if (!levelData || typeof levelData !== 'object') {
      console.log('关卡数据不是对象');
      return false;
    }
    
    // 检查网格数据
    if (!levelData.grid || !Array.isArray(levelData.grid)) {
      console.log('网格数据无效:', levelData.grid);
      return false;
    }
    
    // 检查网格尺寸
    if (levelData.grid.length < 5 || levelData.grid.length > 20) {
      console.log('网格高度无效:', levelData.grid.length);
      return false;
    }
    
    // 检查网格宽度（取第一个字符串的长度）
    if (levelData.grid[0] && typeof levelData.grid[0] === 'string') {
      const width = levelData.grid[0].length;
      if (width < 5 || width > 20) {
        console.log('网格宽度无效:', width);
        return false;
      }
    } else {
      console.log('网格第一行不是字符串:', levelData.grid[0]);
      return false;
    }
    
    // 检查单词数据
    if (!levelData.words || !Array.isArray(levelData.words)) {
      console.log('单词数据无效:', levelData.words);
      return false;
    }
    
    // 检查单词数组是否为空
    if (levelData.words.length === 0) {
      console.log('单词数组为空');
      return false;
    }
    
    console.log('关卡数据验证通过');
    return true;
  }
  
  // 应用关卡配置
  applyLevelConfig() {
    window.currentLevelFilePath = null;
    
    // 清理之前的拖拽状态
    if (window.wordListInstance && typeof window.wordListInstance.clearDragState === 'function') {
      window.wordListInstance.clearDragState();
    }
    
    const title = document.getElementById('level-title').value.trim();
    const width = parseInt(document.getElementById('grid-width').value, 10);
    const height = parseInt(document.getElementById('grid-height').value, 10);
    
    // 读取特殊关卡类型配置（优先从编辑器页面读取，如果不可用则从配置页面读取）
    const editorGoldLevel = document.getElementById('editor-gold-level');
    const editorBlackDotLevel = document.getElementById('editor-black-dot-level');
    const configGoldLevel = document.getElementById('gold-level');
    const configBlackDotLevel = document.getElementById('black-dot-level');
    
    const isGoldLevel = editorGoldLevel ? editorGoldLevel.checked : configGoldLevel.checked;
    const isBlackDotLevel = editorBlackDotLevel ? editorBlackDotLevel.checked : configBlackDotLevel.checked;
    
    // 同步两个页面的特殊选项状态
    this.syncSpecialOptions();
    
    // 更新标题显示
    const displayTitle = title || 'Word Search 关卡编辑器';
    document.getElementById('level-title-display').textContent = displayTitle;
    
    // 更新编辑标题输入框
    const editTitleInput = document.getElementById('edit-level-title');
    if (editTitleInput) {
      editTitleInput.value = title;
    }
    
    // 更新网格大小显示
    document.getElementById('grid-size-display').textContent = `${width}x${height}`;
    
    // 创建新网格
    window.gridInstance.setSize(width, height);
    
    // 传递特殊关卡类型配置到网格实例
    window.gridInstance.setSpecialLevelConfig({
      isGoldLevel: isGoldLevel,
      isBlackDotLevel: isBlackDotLevel
    });
    
    // 更新状态消息，显示特殊关卡类型
    let message = `已创建${width}x${height}网格`;
    if (isGoldLevel || isBlackDotLevel) {
      const types = [];
      if (isGoldLevel) types.push('金币关');
      if (isBlackDotLevel) types.push('黑点关');
      message += ` (${types.join('、')})`;
    }
    
    showStatusMessage(message);
  }
  
  // 导航到指定页面
  navigateTo(pageId) {
    if (pageId === 'home') {
      window.currentLevelFilePath = null;
    }
    console.log(`正在导航到页面: ${pageId}`);
    
    try {
    // 隐藏所有页面
    Object.values(this.pages).forEach(page => {
        if (page) page.classList.remove('active');
    });
    
    // 显示目标页面
      if (this.pages[pageId]) {
    this.pages[pageId].classList.add('active');
    this.currentPage = pageId;
        console.log(`成功导航到页面: ${pageId}`);
        
        // 触发页面导航事件
        window.dispatchEvent(new CustomEvent('pageNavigated', {
          detail: { pageId: pageId, fromPage: this.previousPage || null }
        }));
        this.previousPage = pageId;
        
        // 如果进入编辑器页面，确保特殊选项状态同步
        if (pageId === 'editor') {
          setTimeout(() => {
            this.syncSpecialOptions();
          }, 50);
          
          // 不在这里隐藏导航控件，让LevelNavigationManager自己管理显示逻辑
        }
      } else {
        console.error(`无法导航到页面 ${pageId}: 页面不存在`);
        // 回退到首页
        if (pageId !== 'home' && this.pages.home) {
          this.pages.home.classList.add('active');
          this.currentPage = 'home';
          console.log('已回退到首页');
          showStatusMessage(`导航错误: 找不到页面 "${pageId}"，已返回首页`, 'error');
        }
      }
    } catch (error) {
      console.error(`导航到页面 ${pageId} 时出错:`, error);
      // 尝试回退到首页
      if (this.pages.home) {
        this.pages.home.classList.add('active');
        this.currentPage = 'home';
        console.log('发生错误，已回退到首页');
        showStatusMessage('导航过程中发生错误，已返回首页', 'error');
      }
    }
  }
  
  // 获取当前页面ID
  getCurrentPage() {
    return this.currentPage;
  }
  
  // 渲染普通关卡编辑页面
  renderSimpleEditor() {
    window.currentLevelFilePath = null;
    // 初始化状态
    this.simpleEditorState = {
      stage: 'initial', // 初始阶段，可能的值：initial, preview, generating
      title: '无标题关卡',
      rows: 10,
      cols: 10,
      minWordLength: 3,
      maxWordLength: 7,
      minWordsCount: 5,
      maxWordsCount: 20, // 最大可支持20个单词，前10个用数字表示，后面用特殊符号
      horizontalRatio: 50, // 横向单词比例，0-100
      levelCount: 5,       // 默认生成5个关卡
      currentPreviewIndex: 0, // 当前预览的关卡索引
      generatedLevels: []  // 生成的关卡数组
    };
    
    // 创建普通关卡编辑页面
    if (!this.pages.simpleEditor) {
      const simpleEditorPage = document.createElement('div');
      simpleEditorPage.id = 'simple-editor-page';
      simpleEditorPage.className = 'page';
      
      // 先添加到DOM
      document.body.appendChild(simpleEditorPage);
      
      // 再赋值给this.pages.simpleEditor
      this.pages.simpleEditor = simpleEditorPage;
      
      // 最后更新界面
      this.updateSimpleEditorUI();
    } else {
      // 更新界面
      this.updateSimpleEditorUI();
    }
  }
  
  // 更新普通关卡编辑界面
  updateSimpleEditorUI() {
    const { 
      stage, title, rows, cols, minWordLength, maxWordLength, 
      minWordsCount, maxWordsCount, horizontalRatio, levelCount,
      currentPreviewIndex, generatedLevels
    } = this.simpleEditorState;
    
    const container = this.pages.simpleEditor;
    
    // 检查container是否存在
    if (!container) {
      console.error('simpleEditor容器不存在');
      return;
    }
    
    if (stage === 'initial') {
      // 参数设置阶段 - 显示设置表单
      container.innerHTML = `
        <div class="container">
          <button id="backToHome" class="back-btn">&#10094; 返回首页</button>
          <h2>生成空白网格</h2>
          
          <div class="form-group compact">
            <label for="editorTitleInput">关卡标题：</label>
            <input id="editorTitleInput" class="input-field" placeholder="关卡标题" value="${title}" />
          </div>
          
          <div class="form-row compact">
            <div class="form-group half">
              <label for="editorRowsInput">行数：</label>
              <input id="editorRowsInput" class="input-field" type="number" placeholder="行数(5-20)" min="5" max="20" value="${rows}" />
            </div>
            <div class="form-group half">
              <label for="editorColsInput">列数：</label>
              <input id="editorColsInput" class="input-field" type="number" placeholder="列数(5-20)" min="5" max="20" value="${cols}" />
            </div>
          </div>
          
          <div class="form-group compact">
            <label>单词字母数量范围：</label>
            <div class="form-row compact">
              <div class="form-group half">
                <label for="minWordLengthInput" class="small-label">最小：</label>
                <input id="minWordLengthInput" class="input-field" type="number" min="2" max="10" value="${minWordLength}" />
              </div>
              <div class="form-group half">
                <label for="maxWordLengthInput" class="small-label">最大：</label>
                <input id="maxWordLengthInput" class="input-field" type="number" min="2" max="10" value="${maxWordLength}" />
              </div>
            </div>
          </div>
          
          <div class="form-group compact">
            <label>每个关卡的单词数量范围：</label>
            <div class="form-row compact">
              <div class="form-group half">
                <label for="minWordsCountInput" class="small-label">最小：</label>
                <input id="minWordsCountInput" class="input-field" type="number" min="1" max="20" value="${minWordsCount}" />
              </div>
              <div class="form-group half">
                <label for="maxWordsCountInput" class="small-label">最大：</label>
                <input id="maxWordsCountInput" class="input-field" type="number" min="1" max="20" value="${maxWordsCount}" />
              </div>
            </div>
            <small class="help-text">注：前10个单词用数字(0-9)表示，超过10个将使用特殊符号(!@#$等)表示</small>
          </div>
          
          <div class="form-group compact">
            <label for="directionRatioSlider">横竖与斜向单词比例：${horizontalRatio}% vs ${100 - horizontalRatio}%</label>
            <input id="horizontalRatioSlider" class="slider-field" type="range" min="0" max="100" value="${horizontalRatio}" />
            <div class="slider-labels">
              <span>斜向优先</span>
              <span>横竖优先</span>
            </div>
          </div>
          
          <div class="form-group compact">
            <label for="levelCountInput">生成关卡数量：</label>
            <input id="levelCountInput" class="input-field" type="number" min="1" max="50" value="${levelCount}" />
          </div>
          
          <button id="generateLevelsBtn" class="primary-btn">生成关卡</button>
          <div id="editorResultArea" class="result-area"></div>
        </div>
      `;
      
      // 绑定事件
      this.bindSimpleEditorInitialEvents();
      
    } else if (stage === 'preview') {
      // 预览生成的关卡
      const currentLevel = generatedLevels[currentPreviewIndex] || { grid: [], words: [] };
      
      container.innerHTML = `
        <div class="container">
          <button id="backToSettings" class="back-btn">&#10094; 返回设置</button>
          <h2>批量关卡预览</h2>
          
          <div class="preview-title">关卡 ${currentPreviewIndex + 1}/${generatedLevels.length}</div>
          
          <div class="preview-words">
            <div class="words-list">
              ${currentLevel.words
                .filter(word => word.positioned) // 只显示成功放置的单词
                .map((word, idx) => `
                  <span class="word-symbol">${this.renderWordSymbols(idx, word.length)}</span>
                `).join(' ')}
            </div>
          </div>
          
          <div class="preview-container">
            <div class="preview-grid" style="position:relative;">
              ${this.renderPreviewGrid(currentLevel.grid)}
              <div id="wordLinesContainer" style="position:absolute;top:0;left:0;width:100%;height:100%;">
                <svg id="preview-word-lines" style="position:absolute;top:0;left:0;width:100%;height:100%;"></svg>
              </div>
            </div>
          </div>
          
          <div class="preview-controls">
            <div class="selection-controls">
              <label class="select-level-toggle">
                <input type="checkbox" id="selectLevelToggle" checked>
                <span class="toggle-label">选中本关卡</span>
              </label>
              <span class="preview-counter">已选中 1/1 个</span>
            </div>
          </div>
          
          <div class="preview-footer">
            <button id="exportLevelsBtn" class="primary-btn">导出选中关卡</button>
            <button id="editCurrentPreviewLevelBtn" class="primary-btn" style="margin-left:12px;">编辑本关</button>
            <button id="regenerateLevelsBtn" class="secondary-btn">重新生成</button>
          </div>
          
          <div id="previewResultArea" class="result-area"></div>
        </div>
      `;
      
      // 绑定预览界面事件
      this.bindPreviewEvents();
      
      // 动态绘制SVG连线
      setTimeout(() => {
        console.log('开始绘制SVG连线...');
        const gridTable = container.querySelector('.preview-grid-table');
        const svg = container.querySelector('#preview-word-lines');
        if (!gridTable || !svg) {
          console.error('找不到预览网格表格或SVG容器');
          return;
        }
        
        console.log('表格尺寸:', gridTable.offsetWidth, 'x', gridTable.offsetHeight);
        
        // 先清空旧的SVG内容
        svg.innerHTML = '';
        
        // 获取预览网格容器元素
        const previewGrid = container.querySelector('.preview-grid');
        if (!previewGrid) {
          console.error('找不到预览网格容器');
          return;
        }
        
        // 设置SVG容器的尺寸和位置，与表格完全重叠
        const previewGridRect = previewGrid.getBoundingClientRect();
        const gridTableRect = gridTable.getBoundingClientRect();
        
        // SVG容器相对于preview-grid的位置
        const svgLeft = gridTableRect.left - previewGridRect.left;
        const svgTop = gridTableRect.top - previewGridRect.top;
        
        // 调整SVG容器位置和大小
        const svgContainer = document.getElementById('wordLinesContainer');
        if (svgContainer) {
          svgContainer.style.left = `${svgLeft}px`;
          svgContainer.style.top = `${svgTop}px`;
          svgContainer.style.width = `${gridTableRect.width}px`;
          svgContainer.style.height = `${gridTableRect.height}px`;
          
          svg.setAttribute('width', gridTableRect.width);
          svg.setAttribute('height', gridTableRect.height);
        }
        
        // 确保 SVG 在单元格下方
        svg.style.zIndex = '-1';
        svg.style.pointerEvents = 'none';
        
        // 定义颜色列表 - 使用与手动关卡编辑预览完全相同的颜色
        const colors = [
          '#e74c3c', // 深红色
          '#2980b9', // 深蓝色
          '#27ae60', // 深绿色
          '#f39c12', // 橙色
          '#8e44ad', // 深紫色
          '#d35400', // 深橙色
          '#16a085', // 深青色
          '#f1c40f', // 黄色
          '#c0392b', // 暗红色
          '#2c3e50', // 深灰蓝色
          '#7f8c8d'  // 深灰色
        ];
        
        // 创建单元格映射
        const cells = container.querySelectorAll('.preview-cell');
        const cellMap = {};
        cells.forEach(cell => {
          const row = parseInt(cell.getAttribute('data-row'), 10);
          const col = parseInt(cell.getAttribute('data-col'), 10);
          cellMap[`${row},${col}`] = cell;
        });
        
        // 获取表格位置
        const tableRect = gridTable.getBoundingClientRect();
        
        // 为每个单词绘制连线
        generatedLevels[currentPreviewIndex].words.forEach((word, idx) => {
          // 查找单词在网格中的位置
          const { startRow, startCol, endRow, endCol } = this.findWordPositionInGrid(word, generatedLevels[currentPreviewIndex].grid, idx);
          if (startRow == null) {
            console.warn(`单词 ${idx} 在网格中没有找到有效位置`);
            return;
          }
          
          // 获取单元格引用
          const startCell = cellMap[`${startRow},${startCol}`];
          const endCell = cellMap[`${endRow},${endCol}`];
          if (!startCell || !endCell) {
            console.warn(`单词 ${idx} 的单元格引用未找到`);
            return;
          }
          
          // 获取单元格的实际尺寸
          const cellWidth = startCell.offsetWidth;
          const cellHeight = startCell.offsetHeight;
          
          // 获取表格单元格容器的位置
          const tableCell = startCell.parentElement;
          const tableCellRect = tableCell ? tableCell.getBoundingClientRect() : null;
          
          // 重新计算单元格中心点位置，使用表格坐标系
          const tableBounds = gridTable.getBoundingClientRect();
          const wordLinesContainer = document.getElementById('wordLinesContainer');
          const containerBounds = wordLinesContainer.getBoundingClientRect();
          
          // 获取单元格相对于整个表格的精确位置
          const startCellBounds = startCell.getBoundingClientRect();
          const endCellBounds = endCell.getBoundingClientRect();
          
          // 计算单元格中心相对于SVG容器的精确位置
          // 使用精确的中心点计算
          const startCellCenterX = (startCellBounds.left - containerBounds.left) + (startCellBounds.width / 2) - 11; // 向左移动11像素(原来的8+新增的3)
          const startCellCenterY = (startCellBounds.top - containerBounds.top) + (startCellBounds.height / 2) - 2; // 向上移动2像素
          const endCellCenterX = (endCellBounds.left - containerBounds.left) + (endCellBounds.width / 2) - 11; // 向左移动11像素(原来的8+新增的3)
          const endCellCenterY = (endCellBounds.top - containerBounds.top) + (endCellBounds.height / 2) - 2; // 向上移动2像素
          
          console.log(`单词${idx} - 起点坐标:(${startCellCenterX}, ${startCellCenterY}), 终点坐标:(${endCellCenterX}, ${endCellCenterY})`);
          
          // 获取单词颜色
          const color = colors[idx % colors.length];
          const colorRgba = this.hexToRgba(color, 1.0); // 使用完全不透明色
          
          // 创建粗线条效果 - 减小线条宽度
          const lineWidth = 20; // 从28减小到20，使线条不那么粗
          const halfWidth = lineWidth / 2;
          
          // 计算垂直偏移量
          const angle = Math.atan2(endCellCenterY - startCellCenterY, endCellCenterX - startCellCenterX);
          const dx = Math.sin(angle) * halfWidth;
          const dy = -Math.cos(angle) * halfWidth;
          
          // 创建路径
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("data-word-index", idx);
          
          // 创建直线路径，宽度为lineWidth
          // 1. 从起点半圆开始
          let pathData = `M ${startCellCenterX + dx} ${startCellCenterY + dy}`;
          // 2. 添加半圆弧
          pathData += ` A ${halfWidth} ${halfWidth} 0 0 0 ${startCellCenterX - dx} ${startCellCenterY - dy}`;
          // 3. 直线到终点半圆
          pathData += ` L ${endCellCenterX - dx} ${endCellCenterY - dy}`;
          // 4. 添加终点半圆弧
          pathData += ` A ${halfWidth} ${halfWidth} 0 0 0 ${endCellCenterX + dx} ${endCellCenterY + dy}`;
          // 5. 闭合路径
          pathData += ` Z`;
          
          path.setAttribute("d", pathData);
          path.setAttribute("fill", colorRgba);
          path.setAttribute("stroke", "none");
          
          // 将路径添加到SVG容器
          svg.appendChild(path);
          
          // 添加端点圆点
          const createEndpoint = (centerX, centerY, isStart) => {
            const endpoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            endpoint.setAttribute("cx", centerX);
            endpoint.setAttribute("cy", centerY);
            endpoint.setAttribute("r", 10); // 端点半径从14减小到10，与线条宽度协调
            endpoint.setAttribute("fill", color);
            endpoint.setAttribute("opacity", "0.8"); // 提高不透明度到0.8
            endpoint.setAttribute("data-word-index", idx);
            svg.appendChild(endpoint);
            return endpoint;
          };
          
          // 创建起点和终点
          createEndpoint(startCellCenterX, startCellCenterY, true);
          createEndpoint(endCellCenterX, endCellCenterY, false);
          
          // 标记单元格属于该单词
          const positions = this.generatePositions(startRow, startCol, endRow, endCol, word.direction);
          positions.forEach((pos) => {
            const cell = cellMap[`${pos.row},${pos.col}`];
            if (cell) {
              cell.setAttribute('data-word-index', idx);
              cell.style.position = 'relative';
              cell.style.zIndex = '10';
              cell.style.fontWeight = 'bold';
            }
          });
        });
      }, 100); // 设置一个短暂的延迟，确保DOM已经完全渲染
    } else if (stage === 'generating') {
      // 生成中 - 显示进度
      container.innerHTML = `
        <div class="container">
          <h2>正在生成关卡...</h2>
          <div class="progress-container">
            <div class="progress-bar" id="generateProgressBar" style="width: 0%"></div>
          </div>
          <div id="generateStatus" class="generate-status">正在准备...</div>
        </div>
      `;
    }
  }
  
  // 渲染预览网格
  renderPreviewGrid(grid) {
    if (!grid || !grid.length) {
      return '<div class="empty-grid">无网格数据</div>';
    }
    const rows = grid.length;
    const cols = grid[0].length;
    let cellSize;
    if (rows === cols) {
      cellSize = Math.min(30, Math.floor(350 / rows));
    } else {
      cellSize = Math.min(30, Math.floor(350 / Math.max(rows, cols)));
    }
    let html = '<table class="preview-grid-table" border="0" style="position:relative;">';
    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        const cell = grid[i][j];
        let cellContent = cell;
        html += `<td><div class="preview-cell" data-row="${i}" data-col="${j}" style="width:${cellSize}px;height:${cellSize}px;">${cellContent}</div></td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }
  
  // 辅助方法：根据索引获取对应的符号
  getSymbolForIndex(index) {
    // 0-9对应数字0-9
    if (index < 10) {
      return String(index);
    } 
    // 超过10个单词后用特殊符号表示
    else {
      // 特殊符号列表：从第10个单词开始使用
      const specialSymbols = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', ':', ';', '<', '>', '?', '/'];
      const symbolIndex = index - 10; // 调整索引，从0开始
      
      // 如果超出特殊符号范围，循环使用
      return specialSymbols[symbolIndex % specialSymbols.length];
    }
  }

  // 渲染单词的符号表示（如 1111 表示第一个单词有4个字母）
  renderWordSymbols(wordIndex, length) {
    const symbol = this.getSymbolForIndex(wordIndex);
    return symbol.repeat(length);
  }
  
  // 根据方向代码获取方向名称
  getDirectionName(direction) {
    const directions = {
      'horizontal': '横向',
      'vertical': '竖向',
      'diagonal': '斜向',
      'diagonal-up': '斜向上',
      'diagonal-down': '斜向下'
    };
    return directions[direction] || direction;
  }
  
  // 绑定初始阶段事件
  bindSimpleEditorInitialEvents() {
    document.getElementById('backToHome').addEventListener('click', () => {
      this.navigateTo('home');
    });
    
    // 监听横向比例滑块变化
    const horizontalSlider = document.getElementById('horizontalRatioSlider');
    horizontalSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      
      // 更新标签显示
      horizontalSlider.previousElementSibling.textContent = `横竖与斜向单词比例：${value}% vs ${100 - value}%`;
      
      // 更新状态
      this.simpleEditorState.horizontalRatio = value;
    });
    
    document.getElementById('generateLevelsBtn').addEventListener('click', () => {
      // 获取表单数据
      const title = document.getElementById('editorTitleInput').value.trim() || '无标题关卡';
      const rows = parseInt(document.getElementById('editorRowsInput').value, 10);
      const cols = parseInt(document.getElementById('editorColsInput').value, 10);
      const minWordLength = parseInt(document.getElementById('minWordLengthInput').value, 10);
      const maxWordLength = parseInt(document.getElementById('maxWordLengthInput').value, 10);
      const minWordsCount = parseInt(document.getElementById('minWordsCountInput').value, 10);
      const maxWordsCount = parseInt(document.getElementById('maxWordsCountInput').value, 10);
      const levelCount = parseInt(document.getElementById('levelCountInput').value, 10);
      
      // 验证输入
      if (isNaN(rows) || isNaN(cols) || rows < 5 || cols < 5 || rows > 20 || cols > 20) {
        document.getElementById('editorResultArea').innerHTML = '<div class="error-message">行数和列数必须在5到20之间</div>';
        return;
      }
      
      if (isNaN(minWordLength) || isNaN(maxWordLength) || minWordLength < 2 || maxWordLength > 10 || minWordLength > maxWordLength) {
        document.getElementById('editorResultArea').innerHTML = '<div class="error-message">单词长度范围无效，最小长度2-10，且不能大于最大长度</div>';
        return;
      }
      
      if (isNaN(minWordsCount) || isNaN(maxWordsCount) || minWordsCount < 1 || maxWordsCount > 20 || minWordsCount > maxWordsCount) {
        document.getElementById('editorResultArea').innerHTML = '<div class="error-message">单词数量范围无效，最小1-20，且不能大于最大数量</div>';
        return;
      }
      
      if (isNaN(levelCount) || levelCount < 1 || levelCount > 50) {
        document.getElementById('editorResultArea').innerHTML = '<div class="error-message">关卡数量必须在1到50之间</div>';
        return;
      }
      
      // 更新状态
      this.simpleEditorState.title = title;
      this.simpleEditorState.rows = rows;
      this.simpleEditorState.cols = cols;
      this.simpleEditorState.minWordLength = minWordLength;
      this.simpleEditorState.maxWordLength = maxWordLength;
      this.simpleEditorState.minWordsCount = minWordsCount;
      this.simpleEditorState.maxWordsCount = maxWordsCount;
      this.simpleEditorState.levelCount = levelCount;
      
      // 进入生成状态
      this.simpleEditorState.stage = 'generating';
      this.updateSimpleEditorUI();
      
      // 开始生成关卡
      this.generateLevels();
    });
  }
  
  // 绑定预览页面事件
  bindPreviewEvents() {
    document.getElementById('backToSettings').addEventListener('click', () => {
      this.simpleEditorState.stage = 'initial';
      this.updateSimpleEditorUI();
    });
    
    // 删除了 prevLevelBtn 和 nextLevelBtn 的事件绑定
    // 这些按钮已从预览界面中移除
    
    // 处理选择关卡的复选框
    document.getElementById('selectLevelToggle').addEventListener('change', (e) => {
      const currentIndex = this.simpleEditorState.currentPreviewIndex;
      
      // 如果simpleEditorState中没有selectedLevels属性，则初始化
      if (!this.simpleEditorState.selectedLevels) {
        this.simpleEditorState.selectedLevels = new Array(this.simpleEditorState.generatedLevels.length).fill(true);
      }
      
      // 更新选中状态
      this.simpleEditorState.selectedLevels[currentIndex] = e.target.checked;
      
      // 更新已选中数量的显示
      this.updateSelectedCount();
    });
    
    document.getElementById('exportLevelsBtn').addEventListener('click', () => {
      // 导出选中的关卡
      this.exportSelectedLevels();
    });
    
    document.getElementById('regenerateLevelsBtn').addEventListener('click', () => {
      // 返回设置页面
      this.simpleEditorState.stage = 'initial';
      this.updateSimpleEditorUI();
    });
    
    // 初始化选中计数
    this.updateSelectedCount();
    
    // 编辑本关按钮
    const editBtn = document.getElementById('editCurrentPreviewLevelBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const { currentPreviewIndex, generatedLevels } = this.simpleEditorState;
        const levelData = generatedLevels[currentPreviewIndex];
        if (!levelData) return;
        // 跳转到主编辑器并导入
        this.lastEditorSource = 'simpleBatchPreview';
        this.navigateTo('editor');
        this.resetEditorState && this.resetEditorState();
        // 构造导入格式
        const importData = {
          title: levelData.title,
          grid: levelData.grid.map(row => row.join('')),
          words: levelData.words.map((w, idx) => {
            const symbolWord = this.renderWordSymbols(idx, w.length);
            let pos = '';
            if (w.positions && w.positions.length > 1) {
              const s = w.positions[0], e = w.positions[w.positions.length - 1];
              pos = `${s.row},${s.col};${e.row},${e.col}`;
            }
            return { word: symbolWord, pos };
          }),
          type: 1,
          id: levelData.id
        };
        this.loadImportedLevelToEditor(importData);
      });
    }
  }
  
  // 更新选中关卡数量显示
  updateSelectedCount() {
    if (!this.simpleEditorState.selectedLevels) {
      this.simpleEditorState.selectedLevels = new Array(this.simpleEditorState.generatedLevels.length).fill(true);
    }
    
    const selectedCount = this.simpleEditorState.selectedLevels.filter(Boolean).length;
    const totalCount = this.simpleEditorState.generatedLevels.length;
    
    document.querySelector('.preview-counter').textContent = `已选中 ${selectedCount}/${totalCount} 个`;
  }
  
  // 导出选中的关卡
  exportSelectedLevels() {
    const { generatedLevels, selectedLevels } = this.simpleEditorState;
    
    if (!generatedLevels || generatedLevels.length === 0) {
      document.getElementById('previewResultArea').innerHTML = '<div class="error-message">没有可导出的关卡</div>';
      return;
    }
    
    // 如果没有selectedLevels属性，则初始化为全选
    if (!selectedLevels) {
      this.simpleEditorState.selectedLevels = new Array(generatedLevels.length).fill(true);
    }
    
    // 获取选中的关卡
    const levelsToExport = generatedLevels.filter((level, index) => this.simpleEditorState.selectedLevels[index]);
    
    if (levelsToExport.length === 0) {
      document.getElementById('previewResultArea').innerHTML = '<div class="warning-message">请至少选择一个关卡导出</div>';
      return;
    }
    
    // 显示导出中提示
    document.getElementById('previewResultArea').innerHTML = `<div class="info-message">正在导出${levelsToExport.length}个关卡...</div>`;
    
    // 处理导出逻辑（每个关卡一个文件）
    setTimeout(() => {
      levelsToExport.forEach((level, index) => {
        setTimeout(() => {
          // 创建关卡配置对象
          const exportLevel = this.prepareExportLevel(level);
          
          // 不再显式设置关卡编号，使用关卡自身的level或prepareExportLevel中的默认值
          
          // 创建并下载文件
          const blob = new Blob([JSON.stringify([exportLevel], null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `level_${exportLevel.id}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, index * 500);
      });
      
      // 显示成功消息
      document.getElementById('previewResultArea').innerHTML = `
        <div class="success-message">
          成功导出 ${levelsToExport.length} 个关卡文件
        </div>
      `;
    }, 500);
  }
  
  // 获取示例单词列表，用于导出
  getExampleWords(count) {
    // 常用英文单词列表
    const commonWords = [
      'CAT', 'DOG', 'FISH', 'BIRD', 'CAKE', 'TREE', 'BOOK', 'LOVE', 'STAR', 'MOON',
      'SUN', 'RAIN', 'SNOW', 'WIND', 'FIRE', 'WATER', 'EARTH', 'APPLE', 'FLOWER', 'HOUSE',
      'ROAD', 'RIVER', 'OCEAN', 'BEACH', 'LIGHT', 'NIGHT', 'MUSIC', 'COLOR', 'SHIRT', 'SHOES',
      'DRESS', 'SMILE', 'HAPPY', 'LAUGH', 'BREAD', 'PIZZA', 'PASTA', 'FRUIT', 'CANDY', 'HEART',
      'PHONE', 'MOVIE', 'STORY', 'DREAM', 'SLEEP', 'DANCE', 'PAINT', 'PHOTO', 'CHAIR', 'TABLE'
    ];
    
    // 如果需要的单词数多于列表中的单词，则循环使用
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(commonWords[i % commonWords.length]);
    }
    
    return result;
  }
  
  // 准备关卡导出数据
  prepareExportLevel(level) {
    // 将网格转换为字符串数组
    const gridStrings = level.grid.map(row => row.join(''));
    
    // 创建单词对象数组 - 使用符号表示，过滤掉未成功放置的单词
    const words = level.words
      .filter(word => word.positioned) // 只保留成功放置的单词
      .map((word, index) => {
        // 生成单词符号（如"0000"表示第一个单词有4个字母）
        const symbolWord = this.renderWordSymbols(index, word.length);
        
        // 查找单词的首尾坐标
        const { startRow, startCol, endRow, endCol } = this.findWordPositionInGrid(word, level.grid, index);
        
        // 格式化为"x,y;x,y"的位置字符串
        const pos = startRow !== null ? `${startRow},${startCol};${endRow},${endCol}` : "";
        
        return {
          word: symbolWord, // 使用符号表示
          pos: pos
        };
      });
    
    // 返回符合提供的示例格式的对象
    return {
      level: level.level || 1, // 使用关卡中保存的level值，如果不存在则使用默认值1
      title: level.title,
      type: 1, // 默认类型为1
      grid: gridStrings,
      words: words,
      sentence: "", // 空句子
      bonus: "", // 不计算bonus words
      id: level.id
    };
  }
  
  // 生成关卡
  generateLevels() {
    const { 
      title, rows, cols, minWordLength, maxWordLength, 
      minWordsCount, maxWordsCount, horizontalRatio, levelCount 
    } = this.simpleEditorState;
    
    // 清空之前的关卡
    this.simpleEditorState.generatedLevels = [];
    this.simpleEditorState.currentPreviewIndex = 0;
    
    // 更新进度的函数
    const updateProgress = (index, status) => {
      const progressBar = document.getElementById('generateProgressBar');
      const progressStatus = document.getElementById('generateStatus');
      
      if (progressBar && progressStatus) {
        const percent = Math.floor((index / levelCount) * 100);
        progressBar.style.width = `${percent}%`;
        progressStatus.textContent = status;
      }
    };
    
    // 生成单个关卡的函数
    const generateSingleLevel = (index) => {
      // 随机确定这个关卡的单词数量
      const wordsCount = Math.floor(Math.random() * (maxWordsCount - minWordsCount + 1)) + minWordsCount;
      
      // 生成单词列表（实际上是单词长度列表）
      const words = [];
      for (let i = 0; i < wordsCount; i++) {
        const wordLength = Math.floor(Math.random() * (maxWordLength - minWordLength + 1)) + minWordLength;
        
        // 改进方向选择逻辑
        // 考虑已有单词方向，尝试保持均衡的方向分布
        let horizontalCount = words.filter(w => w.direction === 'horizontal').length;
        let verticalCount = words.filter(w => w.direction === 'vertical').length;
        let diagonalCount = words.filter(w => w.direction === 'diagonal').length;
        
        // 计算当前各方向占比
        let total = horizontalCount + verticalCount + diagonalCount;
        let horizontalRatio = total === 0 ? 0 : horizontalCount / total;
        let verticalRatio = total === 0 ? 0 : verticalCount / total;
        let diagonalRatio = total === 0 ? 0 : diagonalCount / total;
        
        // 动态调整方向选择概率
        let direction;
        if (horizontalRatio < 0.4) { // 水平方向数量少
          direction = Math.random() < 0.7 ? 'horizontal' : (Math.random() < 0.5 ? 'vertical' : 'diagonal');
        } else if (verticalRatio < 0.3) { // 垂直方向数量少
          direction = Math.random() < 0.6 ? 'vertical' : (Math.random() < 0.5 ? 'horizontal' : 'diagonal');
        } else if (diagonalRatio < 0.3) { // 对角线方向数量少
          direction = Math.random() < 0.6 ? 'diagonal' : (Math.random() < 0.5 ? 'horizontal' : 'vertical');
        } else {
          // 按照原来的比例选择
          if (Math.random() * 100 < horizontalRatio) {
            direction = 'horizontal';
          } else {
            direction = Math.random() < 0.75 ? 'vertical' : 'diagonal';
          }
        }
        
        words.push({
          length: wordLength,
          direction: direction,
          positioned: false
        });
      }
      
      // 创建空白网格
      const grid = Array(rows).fill().map(() => Array(cols).fill('*'));
      
      // 尝试放置单词
      words.forEach((word, wordIndex) => {
        // 大概算法，实际中可能更复杂
        // 此处简化为只做随机放置模拟
        // 获取单词对应的符号
        const symbol = this.getSymbolForIndex(wordIndex);
        
        // 记录日志，帮助调试
        console.log(`单词${wordIndex}(长度:${word.length}, 方向:${word.direction}) 使用符号:${symbol}`);
        
        let placed = false;
        let attempts = 0;
        const maxAttempts = 100; // 增加最大尝试次数
        
        while (!placed && attempts < maxAttempts) {
          attempts++;
          
          // 随机起始位置
          let startRow, startCol;
          let directionRow = 0, directionCol = 0;
          
          // 根据方向确定步进方向
          if (word.direction === 'horizontal') {
            directionCol = 1;
            // 确保单词能放得下
            startRow = Math.floor(Math.random() * rows);
            startCol = Math.floor(Math.random() * (cols - word.length + 1));
          } else if (word.direction === 'vertical') {
            directionRow = 1;
            startRow = Math.floor(Math.random() * (rows - word.length + 1));
            startCol = Math.floor(Math.random() * cols);
          } else { // diagonal
            directionRow = 1;
            directionCol = 1;
            startRow = Math.floor(Math.random() * (rows - word.length + 1));
            startCol = Math.floor(Math.random() * (cols - word.length + 1));
          }
          
          // 检查是否可以放置
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const r = startRow + i * directionRow;
            const c = startCol + i * directionCol;
            
            // 检查单元格是否为空或者与当前单词符号相同
            if (grid[r][c] !== '*' && grid[r][c] !== symbol) {
              canPlace = false;
              break;
            }
          }
          
          // 如果可以放置，放置单词
          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              const r = startRow + i * directionRow;
              const c = startCol + i * directionCol;
              grid[r][c] = symbol;
            }
            word.positioned = true;
            placed = true;
            console.log(`成功放置单词${wordIndex}，符号:${symbol}，起始位置:(${startRow},${startCol})，方向:(${directionRow},${directionCol})`);
          }
        }
        
        if (!placed) {
          console.warn(`无法放置单词${wordIndex}，符号:${symbol}，尝试了${attempts}次`);
        }
      });
      
      // 创建关卡对象
      return {
        id: 'WS' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        title: `${title} ${index + 1}`,
        level: index + 1, // 设置关卡等级为索引+1
        grid: grid,
        words: words
          .filter(word => word.positioned) // 只保留成功放置的单词
          .map((w, idx) => ({
            ...w,
            id: idx // 从0开始计数，而不是从1开始
          }))
      };
    };
    
    // 模拟异步生成，这样可以显示进度
    const generateNextLevel = (index) => {
      if (index >= levelCount) {
        // 所有关卡已生成完毕，进入预览状态
        this.simpleEditorState.stage = 'preview';
        this.updateSimpleEditorUI();
        return;
      }
      
      // 更新进度
      updateProgress(index, `正在生成第 ${index + 1}/${levelCount} 个关卡...`);
      
      // 模拟生成延迟
      setTimeout(() => {
        // 生成一个关卡
        const level = generateSingleLevel(index);
        this.simpleEditorState.generatedLevels.push(level);
        
        // 生成下一个
        generateNextLevel(index + 1);
      }, 100); // 小延迟，使进度条有动画效果
    };
    
    // 开始生成
    generateNextLevel(0);
  }
  
  // 导出生成的关卡
  exportGeneratedLevels() {
    const { generatedLevels } = this.simpleEditorState;
    
    if (!generatedLevels || generatedLevels.length === 0) {
      document.getElementById('previewResultArea').innerHTML = '<div class="error-message">没有可导出的关卡</div>';
      return;
    }
    
    // 显示导出中提示
    document.getElementById('previewResultArea').innerHTML = '<div class="info-message">正在准备导出...</div>';
    
    // 使用与prepareExportLevel相同的逻辑处理关卡数据
    const exportLevels = generatedLevels.map((level, levelIndex) => {
      // 将网格转换为字符串数组
      const gridStrings = level.grid.map(row => row.join(''));
      
      // 创建单词对象数组 - 使用符号表示，过滤掉未成功放置的单词
      const words = level.words
        .filter(word => word.positioned) // 只保留成功放置的单词
        .map((word, index) => {
          // 生成单词符号（如"0000"表示第一个单词有4个字母）
          const symbolWord = this.renderWordSymbols(index, word.length);
          
          // 查找单词的首尾坐标
          const { startRow, startCol, endRow, endCol } = this.findWordPositionInGrid(word, level.grid, index);
          
          // 格式化为"x,y;x,y"的位置字符串
          const pos = startRow !== null ? `${startRow},${startCol};${endRow},${endCol}` : "";
          
          return {
            word: symbolWord, // 使用符号表示
            pos: pos
          };
        });
      
      // 返回符合提供的示例格式的对象
      return {
        level: levelIndex + 1, // 关卡编号
        title: level.title,
        type: 1, // 默认类型为1
        grid: gridStrings,
        words: words,
        sentence: "", // 空句子
        bonus: "", // 不计算bonus words
        id: level.id
      };
    });
    
    // 处理导出逻辑
    setTimeout(() => {
      // 一个一个下载
      exportLevels.forEach((level, index) => {
        setTimeout(() => {
          const blob = new Blob([JSON.stringify([level], null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `level_${level.id}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, index * 500); // 每个下载间隔500毫秒
      });
      
      // 显示成功消息
      document.getElementById('previewResultArea').innerHTML = `
        <div class="success-message">
          成功导出 ${exportLevels.length} 个关卡文件
        </div>
      `;
    }, 500);
  }
  
  // 渲染关卡复刻页面
  renderReplicaEditor() {
    window.currentLevelFilePath = null;
    // 创建关卡复刻页面
    if (!this.pages.replicaEditor) {
      const replicaEditorPage = document.createElement('div');
      replicaEditorPage.id = 'replica-editor-page';
      replicaEditorPage.className = 'page';
      
      // 先添加到DOM
      document.body.appendChild(replicaEditorPage);
      
      // 再赋值
      this.pages.replicaEditor = replicaEditorPage;
      
      // 初始化复刻状态
      this.replicaState = {
        title: '',
        words: '',
        rows: 8,
        cols: 8,
        grid: null,
        isSpecial: false,     // 是否特殊关卡
        wordPairs: [],        // 特殊关卡的单词对
        normalWords: []       // 普通关卡的单词列表
      };
      
      // 最后更新界面
      this.updateReplicaEditor();
    } else {
      this.updateReplicaEditor();
    }
  }
  
  // 更新复刻编辑器内容
  updateReplicaEditor() {
    const { title, words, rows, cols, grid, isSpecial } = this.replicaState;
    
    // 确保数组初始化
    if (!Array.isArray(this.replicaState.normalWords)) {
      this.replicaState.normalWords = [];
    }
    
    if (!Array.isArray(this.replicaState.wordPairs)) {
      this.replicaState.wordPairs = [];
    }
    
    const { normalWords, wordPairs } = this.replicaState;
    
    const container = this.pages.replicaEditor;
    
    // 检查container是否存在
    if (!container) {
      console.error('replicaEditor容器不存在');
      return;
    }
    
    container.innerHTML = `
      <div class="container">
        <button id="backToHomeReplica" class="back-btn">&#10094; 返回首页</button>
        <h2>关卡复刻</h2>
        
        <div class="replica-editor-layout">
          <!-- 左侧：表单和单词列表 -->
          <div class="replica-form-container">
            <div class="form-group">
              <label for="replicaTitleInput">关卡标题：</label>
              <input id="replicaTitleInput" class="input-field" placeholder="关卡标题" value="${title}" />
            </div>
            
            <div class="form-group special-toggle-group">
              <label>
                特殊关卡
                <input type="checkbox" id="specialToggle" ${isSpecial ? 'checked' : ''}>
              </label>
            </div>
            
            ${!isSpecial ? `
              <div class="form-group compact-form-group">
                <label>单词列表：</label>
                <div class="word-table-container compact-table">
                  <table id="normalWordTable" class="word-table">
                    <thead>
                      <tr>
                        <th>单词</th>
                        <th width="30"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        if (normalWords.length === 0 && words) {
                          this.replicaState.normalWords = words.split(/\r?\n/).map(w => w.trim()).filter(Boolean).map(w => ({word: w}));
                        }
                        return (this.replicaState.normalWords || []).map((item, idx) => `
                          <tr>
                            <td><input type="text" class="normal-word-col" data-idx="${idx}" value="${item.word}" /></td>
                            <td><button class="delete-word-btn" data-idx="${idx}">×</button></td>
                          </tr>
                        `).join('');
                      })()}
                    </tbody>
                  </table>
                  <button id="addNormalWordBtn" class="secondary-btn small-btn">添加单词</button>
                </div>
              </div>
            ` : `
              <div class="form-group compact-form-group">
                <label>单词对列表：</label>
                <div class="instruction-note">
                  <p>使用说明：</p>
                  <ul>
                    <li>左侧 <strong>单词</strong> 将显示在最终关卡的单词列表中</li>
                    <li>右侧 <strong>对应词</strong> 是需要在网格中手动填入并查找位置的词</li>
                    <li>系统会自动计算 <strong>bonus words</strong>（在网格中的额外单词，不包括已添加的对应词）</li>
                  </ul>
                </div>
                <div class="word-table-container compact-table">
                  <table id="wordPairTable" class="word-table">
                    <thead>
                      <tr>
                        <th>单词 (列表中显示)</th>
                        <th>对应词 (在网格中查找)</th>
                        <th width="30"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(() => {
                        if (wordPairs.length === 0 && words) {
                          this.replicaState.wordPairs = words.split(/\r?\n/).map(w => ({word: w.trim(), pair: ''})).filter(x => x.word);
                        }
                        return (this.replicaState.wordPairs || []).map((pair, idx) => `
                          <tr>
                            <td><input type="text" class="word-col" data-idx="${idx}" value="${pair.word}" /></td>
                            <td><input type="text" class="pair-col" data-idx="${idx}" value="${pair.pair||''}" /></td>
                            <td><button class="delete-pair-btn" data-idx="${idx}">×</button></td>
                          </tr>
                        `).join('');
                      })()}
                    </tbody>
                  </table>
                  <button id="addWordPairBtn" class="secondary-btn small-btn">添加单词对</button>
                </div>
              </div>
            `}
    
            <div class="form-row">
              <div class="form-group half">
                <label for="replicaRowsInput">行数：</label>
                <input id="replicaRowsInput" class="input-field" type="number" min="2" max="20" value="${rows}" />
              </div>
              <div class="form-group half">
                <label for="replicaColsInput">列数：</label>
                <input id="replicaColsInput" class="input-field" type="number" min="2" max="20" value="${cols}" />
              </div>
            </div>
            <button id="replicaGridConfirmBtn" class="primary-btn">生成网格</button>
          </div>
          
          <!-- 右侧：网格显示 -->
          <div class="replica-grid-container">
            <div id="replicaGridArea" class="grid-input-area"></div>
          </div>
        </div>
        
        <div class="replica-footer">
          <button id="replicaExportBtn" class="primary-btn" ${!grid ? 'disabled' : ''}>导出关卡</button>
          <div id="replicaResultArea" class="result-area"></div>
        </div>
      </div>
    `;

    // 绑定事件
    document.getElementById('backToHomeReplica').addEventListener('click', () => {
      this.navigateTo('home');
    });
    
    // 特殊关卡切换
    document.getElementById('specialToggle').addEventListener('change', (e) => {
      this.replicaState.isSpecial = e.target.checked;
      this.updateReplicaEditor();
    });

    // 根据关卡类型绑定不同的事件
    if (!isSpecial) {
      // 普通关卡的单词列表处理
      document.querySelectorAll('.normal-word-col').forEach(input => {
        // 添加自动转大写功能
        input.addEventListener('input', (e) => {
          const cursorPosition = e.target.selectionStart;
          e.target.value = e.target.value.toUpperCase();
          e.target.setSelectionRange(cursorPosition, cursorPosition);
          
          const idx = parseInt(e.target.dataset.idx, 10);
          this.replicaState.normalWords[idx].word = e.target.value.trim();
        });
      });
      
      document.querySelectorAll('.delete-word-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          console.log('删除单词前:', JSON.stringify(this.replicaState.normalWords));
          console.log('删除索引:', idx);
          
          if (Array.isArray(this.replicaState.normalWords)) {
            this.replicaState.normalWords.splice(idx, 1);
            console.log('删除单词后:', JSON.stringify(this.replicaState.normalWords));
            this.updateReplicaEditor();
          } else {
            console.error('normalWords不是数组:', this.replicaState.normalWords);
          }
        });
      });
      
      document.getElementById('addNormalWordBtn').addEventListener('click', () => {
        this.replicaState.normalWords.push({word: ''});
        this.updateReplicaEditor();
      });
    } else {
      // 特殊关卡的单词对处理
      document.querySelectorAll('.word-col').forEach(input => {
        // 添加自动转大写功能
        input.addEventListener('input', (e) => {
          const cursorPosition = e.target.selectionStart;
          e.target.value = e.target.value.toUpperCase();
          e.target.setSelectionRange(cursorPosition, cursorPosition);
          
          const idx = parseInt(e.target.dataset.idx, 10);
          this.replicaState.wordPairs[idx].word = e.target.value.trim();
        });
      });
      
      document.querySelectorAll('.pair-col').forEach(input => {
        // 添加自动转大写功能
        input.addEventListener('input', (e) => {
          const cursorPosition = e.target.selectionStart;
          e.target.value = e.target.value.toUpperCase();
          e.target.setSelectionRange(cursorPosition, cursorPosition);
          
          const idx = parseInt(e.target.dataset.idx, 10);
          this.replicaState.wordPairs[idx].pair = e.target.value.trim();
        });
      });
      
      document.querySelectorAll('.delete-pair-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx, 10);
          console.log('删除单词对前:', JSON.stringify(this.replicaState.wordPairs));
          console.log('删除索引:', idx);
          
          if (Array.isArray(this.replicaState.wordPairs)) {
            this.replicaState.wordPairs.splice(idx, 1);
            console.log('删除单词对后:', JSON.stringify(this.replicaState.wordPairs));
            this.updateReplicaEditor();
          } else {
            console.error('wordPairs不是数组:', this.replicaState.wordPairs);
          }
        });
      });
      
      document.getElementById('addWordPairBtn').addEventListener('click', () => {
        this.replicaState.wordPairs.push({word: '', pair: ''});
        this.updateReplicaEditor();
      });
    }

    document.getElementById('replicaGridConfirmBtn').addEventListener('click', () => {
      this.replicaState.title = document.getElementById('replicaTitleInput').value;
      
      // 更新单词列表
      if (!isSpecial) {
        this.replicaState.words = this.replicaState.normalWords.map(item => item.word).join('\n');
      } else {
        this.replicaState.words = this.replicaState.wordPairs.map(item => item.word).join('\n');
      }
      
      this.replicaState.rows = parseInt(document.getElementById('replicaRowsInput').value, 10);
      this.replicaState.cols = parseInt(document.getElementById('replicaColsInput').value, 10);
      
      if (isNaN(this.replicaState.rows) || this.replicaState.rows < 2 || this.replicaState.rows > 20 ||
          isNaN(this.replicaState.cols) || this.replicaState.cols < 2 || this.replicaState.cols > 20) {
        document.getElementById('replicaResultArea').innerHTML = '<div class="error-message">行数和列数必须在2到20之间</div>';
        return;
      }
      
      // 创建空白网格数组
      this.replicaState.grid = [];
      for (let i = 0; i < this.replicaState.rows; i++) {
        const row = [];
        for (let j = 0; j < this.replicaState.cols; j++) {
          row.push('');
        }
        this.replicaState.grid.push(row);
      }
      
      // 更新网格显示
      this.updateGrid();
      
      // 启用导出按钮
      document.getElementById('replicaExportBtn').disabled = false;
    });

    // 如果已有网格数据，显示网格
    if (grid) {
      this.updateGrid();
    } else {
      document.getElementById('replicaGridArea').innerHTML = '<div class="empty-grid-message">请设置行列数并点击"生成网格"</div>';
    }

    document.getElementById('replicaExportBtn').addEventListener('click', () => {
      this.exportReplicaLevel();
    });
  }
  
  // 更新网格显示
  updateGrid() {
    if (!this.replicaState.grid) return;
    
    const { rows, cols, grid } = this.replicaState;
    const gridArea = document.getElementById('replicaGridArea');
    
    // 计算网格单元格大小，确保适合容器
    const cellSize = Math.min(40, Math.floor(600 / Math.max(rows, cols)));
    
    let html = '<div class="grid-table"><table>';
    for (let i = 0; i < rows; ++i) {
      html += '<tr>';
      for (let j = 0; j < cols; ++j) {
        const value = grid[i][j] || '';
        html += `<td><input class="grid-cell" style="width:${cellSize}px;height:${cellSize}px;" maxlength="1" data-row="${i}" data-col="${j}" value="${value}" /></td>`;
      }
      html += '</tr>';
    }
    html += '</table></div>';
    
    gridArea.innerHTML = html;
    
    // 绑定网格单元格输入事件
    document.querySelectorAll('#replicaGridArea input').forEach(input => {
      input.addEventListener('input', (e) => {
        let val = e.target.value.toUpperCase();
        // 限制只能输入字母
        if (!/^[A-Z]$/i.test(val)) {
          val = '';
        }
        e.target.value = val;
        
        const r = parseInt(e.target.dataset.row, 10);
        const c = parseInt(e.target.dataset.col, 10);
        this.replicaState.grid[r][c] = val;
      });
    });
  }

  // 检测在网格中的单词的坐标（首尾坐标点）
  findWordPositions(word, grid) {
    // 检查单词和网格是否有效
    if (!word || !grid || !grid.length || !grid[0].length) {
      return "";
    }
    
    const rows = grid.length;
    const cols = grid[0].length;
    const wordUpper = word.toUpperCase();
    
    // 如果单词长度为0，直接返回
    if (wordUpper.length === 0) {
      return "";
    }
    
    const directions = [
      { name: 'horizontal', rowStep: 0, colStep: 1 },
      { name: 'reverseHorizontal', rowStep: 0, colStep: -1 },
      { name: 'vertical', rowStep: 1, colStep: 0 },
      { name: 'reverseVertical', rowStep: -1, colStep: 0 },
      { name: 'diagonal', rowStep: 1, colStep: 1 },
      { name: 'reverseDiagonal', rowStep: -1, colStep: -1 },
      { name: 'diagonal2', rowStep: 1, colStep: -1 },
      { name: 'reverseDiagonal2', rowStep: -1, colStep: 1 }
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        for (const direction of directions) {
          // 检查这个方向是否可以放下整个单词
          const endRow = r + (wordUpper.length - 1) * direction.rowStep;
          const endCol = c + (wordUpper.length - 1) * direction.colStep;
          
          if (
            endRow >= 0 && endRow < rows &&
            endCol >= 0 && endCol < cols
          ) {
            let found = true;
            
            // 检查单词是否匹配
            for (let i = 0; i < wordUpper.length; i++) {
              const checkRow = r + i * direction.rowStep;
              const checkCol = c + i * direction.colStep;
              
              // 获取当前单元格的字母，确保处理空值
              const cellValue = grid[checkRow][checkCol];
              if (!cellValue || cellValue === '' || cellValue.toUpperCase() !== wordUpper[i]) {
                found = false;
                break;
              }
            }
            
            if (found) {
              // 返回首尾坐标 - 修改为(行,列)格式，而不是之前的(列,行)格式
              return `${r},${c};${endRow},${endCol}`;
            }
          }
        }
      }
    }
    
    return ""; // 如果没找到，返回空字符串
  }

  // 使用类似的算法检测bonus words
  detectBonusWords(grid, mainWords) {
    try {
      console.log('开始检测bonus words...');
      
      // 基本验证
      if (!grid || !grid.length || !grid[0].length) {
        console.warn('无效的网格数据');
        return [];
      }
      
      // 确保mainWords是数组并且所有元素都有效
      const validMainWords = Array.isArray(mainWords) 
        ? mainWords.filter(w => w && typeof w === 'string').map(w => w.toUpperCase())
        : [];
      
      console.log('主单词列表:', validMainWords);
      
      // 使用Set存储主单词，方便查找
      const mainWordsSet = new Set(validMainWords);
      const foundWords = new Set(); // 存储发现的单词字符串
      
      // 加载字典
      let dictSet = new Set();
      let usedBackupDict = false;
      
      if (window.electronAPI && typeof window.electronAPI.readDictionary === 'function') {
        console.log('从electronAPI读取字典...');
        const dictContent = window.electronAPI.readDictionary();
        
        if (dictContent && dictContent.length > 0) {
          // 支持逗号、换行分割
          const words = dictContent.split(/,|\n|\r/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
          dictSet = new Set(words);
          console.log('字典加载完成，单词数:', dictSet.size);
          
          // 输出几个示例单词（用于调试）
          const sampleWords = Array.from(dictSet).slice(0, 5);
          console.log('字典示例单词:', sampleWords.join(', '));
        } else {
          console.warn('未能加载字典内容或字典为空，将使用备用字典');
          usedBackupDict = true;
        }
      } else {
        console.warn('electronAPI或readDictionary方法不可用，将使用备用字典');
        usedBackupDict = true;
      }
      
      // 如果主字典加载失败，使用备用字典（包含一些常见英文单词）
      if (usedBackupDict || dictSet.size === 0) {
        const backupDict = [
          'ACT', 'AIR', 'AND', 'ART', 'ASK', 'BAD', 'BAG', 'BAR', 'BED', 'BIG', 'BOX', 'BOY', 'BUY', 
          'CAR', 'CAT', 'CUP', 'CUT', 'DAY', 'DOG', 'EAR', 'EAT', 'EGG', 'END', 'EYE', 'FAR', 'FEW', 
          'FLY', 'FOR', 'GET', 'GOD', 'HAT', 'HER', 'HIM', 'HIS', 'HOT', 'HOW', 'JOB', 'KEY', 'KID', 
          'LAW', 'LAY', 'LEG', 'LET', 'LIE', 'LOT', 'LOW', 'MAN', 'MAP', 'MEN', 'MOM', 'MRS', 'NEW', 
          'NOT', 'NOW', 'OFF', 'OLD', 'ONE', 'OUR', 'OUT', 'OWN', 'PAY', 'PER', 'PUT', 'RED', 'RUN', 
          'SAY', 'SEA', 'SEE', 'SET', 'SEX', 'SHE', 'SIR', 'SIT', 'SIX', 'SON', 'SUN', 'TAX', 'TEA', 
          'TEN', 'THE', 'TOO', 'TOP', 'TRY', 'TWO', 'USE', 'WAR', 'WAY', 'WHO', 'WHY', 'WIN', 'YES', 
          'YET', 'YOU', 'ABLE', 'ALSO', 'AREA', 'AWAY', 'BABY', 'BACK', 'BALL', 'BANK', 'BASE', 'BEAR', 
          'BEAT', 'BEEN', 'BEST', 'BILL', 'BIRD', 'BLUE', 'BOAT', 'BODY', 'BOOK', 'BORN', 'BOTH', 'CALL', 
          'CARD', 'CARE', 'CASE', 'CASH', 'CITY', 'CLUB', 'COLD', 'COME', 'COOK', 'COOL', 'COST', 'CREW', 
          'DARK', 'DATA', 'DATE', 'DAWN', 'DAYS', 'DEAD', 'DEAL', 'DEAR', 'DEEP', 'DESK', 'DOOR', 'DOWN', 
          'DRAW', 'DROP', 'EACH', 'EAST', 'EASY', 'EDGE', 'ELSE', 'EVEN', 'EVER', 'FACE', 'FACT', 'FAIL', 
          'FAIR', 'FALL', 'FARM', 'FAST', 'FEAR', 'FEEL', 'FEET', 'FELL', 'FELT', 'FILE', 'FILL', 'FILM', 
          'FIND', 'FINE', 'FIRE', 'FIRM', 'FISH', 'FIVE', 'FLAT', 'FLOW', 'FOOD', 'FOOT', 'FORM', 'FOUR', 
          'FREE', 'FROM', 'FULL', 'FUND', 'GAME', 'GATE', 'GAVE', 'GIFT', 'GIRL', 'GIVE', 'GLAD', 'GOAL', 
          'GOES', 'GOLD', 'GOLF', 'GONE', 'GOOD', 'GREW', 'GROW', 'HAIR', 'HALF', 'HALL', 'HAND', 'HANG', 
          'HARD', 'HAVE', 'HEAD', 'HEAR', 'HEAT', 'HELD', 'HELL', 'HELP', 'HERE', 'HIGH', 'HILL', 'HOLD', 
          'HOME', 'HOPE', 'HOUR', 'HUGE', 'HUNG', 'HUNT', 'HURT', 'IDEA', 'INTO', 'IRON', 'ITEM', 'JACK', 
          'JANE', 'JEAN', 'JOHN', 'JOIN', 'JUMP', 'JURY', 'JUST', 'KEEP', 'KEPT', 'KIND', 'KING', 'KNEW', 
          'KNOW', 'LACK', 'LADY', 'LAID', 'LAKE', 'LAND', 'LANE', 'LAST', 'LATE', 'LEAD', 'LEFT', 'LESS', 
          'LIFE', 'LIFT', 'LIKE', 'LINE', 'LINK', 'LIST', 'LIVE', 'LOAD', 'LOAN', 'LOCK', 'LONG', 'LOOK', 
          'LORD', 'LOSE', 'LOSS', 'LOST', 'LOVE', 'LUCK', 'MADE', 'MAIL', 'MAIN', 'MAKE', 'MALE', 'MANY', 
          'MARK', 'MARY', 'MASS', 'MATT', 'MEAL', 'MEAN', 'MEAT', 'MEET', 'MENU', 'MERE', 'MIKE', 'MILE', 
          'MILK', 'MILL', 'MIND', 'MINE', 'MISS', 'MODE', 'MOOD', 'MOON', 'MORE', 'MOST', 'MOVE', 'MUCH', 
          'MUST', 'NAME', 'NAVY', 'NEAR', 'NECK', 'NEED', 'NEWS', 'NEXT', 'NICE', 'NICK', 'NINE', 'NONE', 
          'NOSE', 'NOTE', 'OKAY', 'ONCE', 'ONLY', 'ONTO', 'OPEN', 'ORAL', 'OVER', 'PACE', 'PACK', 'PAGE'
        ];
        console.log('使用备用字典，包含', backupDict.length, '个常见英文单词');
        dictSet = new Set(backupDict);
      }
      
      const rows = grid.length;
      const cols = grid[0].length;
      const directions = [
        { name: 'horizontal', rowStep: 0, colStep: 1 },
        { name: 'reverseHorizontal', rowStep: 0, colStep: -1 },
        { name: 'vertical', rowStep: 1, colStep: 0 },
        { name: 'reverseVertical', rowStep: -1, colStep: 0 },
        { name: 'diagonal', rowStep: 1, colStep: 1 },
        { name: 'reverseDiagonal', rowStep: -1, colStep: -1 },
        { name: 'diagonal2', rowStep: 1, colStep: -1 },
        { name: 'reverseDiagonal2', rowStep: -1, colStep: 1 }
      ];
      
      // 添加直接检查网格中所有可能的单词，不依赖于字典
      // 检查所有长度为3及以上的连续字母组合
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          for (const direction of directions) {
            // 尝试从长度3开始的单词
            for (let length = 3; length <= Math.min(10, Math.max(rows, cols)); length++) {
              const endRow = r + (length - 1) * direction.rowStep;
              const endCol = c + (length - 1) * direction.colStep;
              
              if (
                endRow >= 0 && endRow < rows &&
                endCol >= 0 && endCol < cols
              ) {
                let word = '';
                let isValid = true;
                
                // 构建单词
                for (let i = 0; i < length; i++) {
                  const checkRow = r + i * direction.rowStep;
                  const checkCol = c + i * direction.colStep;
                  
                  if (checkRow < 0 || checkRow >= rows || checkCol < 0 || checkCol >= cols) {
                    isValid = false;
                    break;
                  }
                  
                  const letter = grid[checkRow][checkCol];
                  if (!letter || letter.trim() === '') {
                    isValid = false;
                    break;
                  }
                  word += letter;
                }
                
                if (!isValid) continue;
                
                word = word.toUpperCase();
                
                // 如果单词长度>=3，不是主单词，并且存在于字典中，则添加为bonus word
                if (word.length >= 3 && !mainWordsSet.has(word) && dictSet.has(word)) {
                  foundWords.add(word);
                }
              }
            }
          }
        }
      }
      
      // 转为数组并排序
      const result = Array.from(foundWords).sort();
      console.log('找到', result.length, '个bonus words');
      if (result.length > 0) {
        console.log('示例:', result.slice(0, Math.min(5, result.length)).join(', '));
      }
      return result;
    } catch (error) {
      console.error('检测bonus words时出错:', error);
      return [];
    }
  }
  
  // 更新并添加单词坐标计算
  exportReplicaLevel() {
    try {
      // 从输入中获取数据
      const title = document.getElementById('replicaTitleInput').value || '无标题关卡';
      
      // 验证必要的数据
      if (!this.replicaState.isSpecial && (!this.replicaState.normalWords || this.replicaState.normalWords.length === 0)) {
        showStatusMessage('请至少添加一个单词', 'error');
        return;
      }
      
      if (this.replicaState.isSpecial && (!this.replicaState.wordPairs || this.replicaState.wordPairs.length === 0)) {
        showStatusMessage('请至少添加一个单词对', 'error');
        return;
      }
      
      if (!this.replicaState.grid) {
        showStatusMessage('请先生成网格', 'error');
        return;
      }
      
      // 生成唯一ID - 使用类似示例中的格式
      const levelId = 'WS' + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // 准备grid数据 - 转换为字符串数组格式而不是二维数组
      const gridStrings = [];
      for (let i = 0; i < this.replicaState.rows; i++) {
        let rowString = '';
        for (let j = 0; j < this.replicaState.cols; j++) {
          rowString += this.replicaState.grid[i][j] || ' ';
        }
        gridStrings.push(rowString);
      }
      
      // 计算单词坐标并创建单词对象数组
      const wordObjects = [];
      
      if (!this.replicaState.isSpecial) {
        // 普通关卡处理：查找单词本身在网格中的位置
        const validWordList = this.replicaState.normalWords
          .filter(item => item && item.word && typeof item.word === 'string')
          .map(item => item.word);
          
        console.log('普通关卡单词列表:', validWordList);
        
        for (const word of validWordList) {
          const pos = this.findWordPositions(word, this.replicaState.grid);
          wordObjects.push({
            word: word.toUpperCase(),
            pos: pos
          });
        }
        
        // 过滤掉没有找到坐标的单词并给出警告
        const missingPositions = wordObjects.filter(w => !w.pos).map(w => w.word);
        if (missingPositions.length > 0) {
          console.warn('以下单词在网格中未找到：', missingPositions.join(', '));
          showStatusMessage(`警告：部分单词未在网格中找到 (${missingPositions.join(', ')})`, 'warning');
        }
        
        // 计算bonus words
        const mainWords = validWordList.map(w => w.toUpperCase());
        const bonusWords = this.detectBonusWords(this.replicaState.grid, mainWords);
        
        console.log('主单词列表:', mainWords);
        console.log('找到的bonus words:', bonusWords);
        
        // 创建关卡数据对象 - 按照示例格式
        const levelConfig = {
          level: parseInt(level.level) || 1, // 使用关卡中保存的level值，如果不存在则使用默认值1
          title: title,
          type: 1, // 默认类型
          grid: gridStrings,
          words: wordObjects.filter(w => w.pos), // 过滤掉没有找到坐标的单词
          sentence: "", // 空句子
          bonus: Array.isArray(bonusWords) && bonusWords.length > 0 ? bonusWords.join(',') : "",
          id: levelId
        };
        
        console.log('导出的配置对象:', levelConfig);
        
        // 创建配置文件 - 数据需要放在数组中
        const configContent = JSON.stringify([levelConfig], null, 4);
        
        // 创建下载链接并导出
        this.downloadConfigFile(configContent, levelId);
      } else {
        // 特殊关卡处理：单词对的处理
        // 筛选有效的单词对
        const validWordPairs = this.replicaState.wordPairs
          .filter(pair => 
            pair && 
            typeof pair.word === 'string' && pair.word.trim() !== '' &&
            typeof pair.pair === 'string' && pair.pair.trim() !== '');
            
        console.log('特殊关卡单词对:', validWordPairs);
        
        // 对于每个单词对，在网格中查找对应词的位置
        for (const pair of validWordPairs) {
          // 在网格中查找对应词的位置
          const pairPos = this.findWordPositions(pair.pair, this.replicaState.grid);
          
          // 添加到单词对象数组，使用原始单词作为word，对应词的位置作为pos
          wordObjects.push({
            word: pair.word.toUpperCase(),
            pos: pairPos,
            pair: pair.pair.toUpperCase() // 添加对应词字段，便于调试
          });
        }
        
        // 过滤掉没有找到坐标的单词对并给出警告
        const missingPairs = wordObjects.filter(w => !w.pos).map(w => `${w.word}(${w.pair})`);
        if (missingPairs.length > 0) {
          console.warn('以下单词对的对应词在网格中未找到：', missingPairs.join(', '));
          showStatusMessage(`警告：部分单词对的对应词未在网格中找到 (${missingPairs.join(', ')})`, 'warning');
        }
        
        // 计算bonus words - 对于特殊关卡，我们也需要计算bonus words
        // 收集所有对应词作为主单词列表，以确保不会被当作bonus words
        const mainWords = validWordPairs.map(pair => pair.pair.toUpperCase());
        const bonusWords = this.detectBonusWords(this.replicaState.grid, mainWords);
        
        console.log('特殊关卡主单词列表(对应词):', mainWords);
        console.log('找到的bonus words:', bonusWords);
        
        // 创建关卡数据对象 - 按照示例格式
        const levelConfig = {
          level: parseInt(level.level) || 1, // 使用关卡中保存的level值，如果不存在则使用默认值1
          title: title,
          type: 2, // 特殊关卡类型
          grid: gridStrings,
          words: wordObjects.filter(w => w.pos).map(({ word, pos }) => ({ word, pos })), // 过滤掉没有找到坐标的单词，并移除pair字段
          sentence: "", // 空句子
          bonus: Array.isArray(bonusWords) && bonusWords.length > 0 ? bonusWords.join(',') : "",
          id: levelId
        };
        
        console.log('导出的特殊关卡配置对象:', levelConfig);
        
        // 创建配置文件 - 数据需要放在数组中
        const configContent = JSON.stringify([levelConfig], null, 4);
        
        // 创建下载链接并导出
        this.downloadConfigFile(configContent, levelId);
      }
    } catch (error) {
      console.error('导出关卡配置出错:', error);
      showStatusMessage('导出关卡配置失败，请查看控制台', 'error');
    }
  }
  
  // 辅助方法：下载配置文件
  downloadConfigFile(configContent, levelId) {
    // 创建下载链接
    const blob = new Blob([configContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `level_${levelId}.json`;
    
    // 创建下载链接并点击
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // 清理
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showStatusMessage(`已导出关卡配置: ${filename}`);
  }
  
  // 为单词绘制连线
  renderWordLines(grid, words) {
    if (!grid || !grid.length || !words || !words.length) return '';
    // 只返回SVG容器元素，实际线条将在 updateSimpleEditorUI 中通过 JS 绘制
    return `<svg id="preview-word-lines" class="word-lines-container" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;"></svg>`;
  }
  
  // 查找单词在网格中的位置
  findWordPositionInGrid(word, grid, symbol) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    // 将symbol参数转换为实际使用的符号字符串
    // symbol参数现在已经是从0开始的索引，直接使用getSymbolForIndex
    const symbolStr = this.getSymbolForIndex(symbol);
    
    // 存储找到的所有符号位置
    const positions = [];
    
    // 查找网格中所有匹配的符号位置
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] === symbolStr) {
          positions.push({ row, col });
        }
      }
    }
    
    // 如果没有找到足够的位置
    if (positions.length < 2) {
      console.warn(`单词符号 ${symbolStr} 找不到足够的位置`);
      return { startRow: null, startCol: null, endRow: null, endCol: null };
    }
    
    // 确定单词方向
    let direction = word.direction || 'horizontal';

    // 查找方向与符号匹配的路径
    const directions = [
      { name: 'horizontal', rowStep: 0, colStep: 1 },
      { name: 'vertical', rowStep: 1, colStep: 0 },
      { name: 'diagonal', rowStep: 1, colStep: 1 },
      { name: 'diagonal-up', rowStep: -1, colStep: 1 }
    ];
    
    // 首先，尝试按照单词指定的方向排序位置
    let dir = directions.find(d => d.name === direction);
    if (!dir) dir = directions[0]; // 默认使用横向
    
    // 基于方向对位置排序
    positions.sort((a, b) => {
      // 主要方向排序
      const primaryDiff = (a.row * dir.rowStep + a.col * dir.colStep) - 
                           (b.row * dir.rowStep + b.col * dir.colStep);
      if (primaryDiff !== 0) return primaryDiff;
      
      // 相同主要方向时，使用二级排序
      if (dir.rowStep !== 0) {
        return a.col - b.col; // 如果主要是垂直方向，次要按列排序
      } else {
        return a.row - b.row; // 如果主要是水平方向，次要按行排序
      }
    });
    
    // 检查排序后的位置是否连续
    let isConsecutive = true;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i-1];
      const curr = positions[i];
      
      if ((curr.row - prev.row) !== dir.rowStep || 
          (curr.col - prev.col) !== dir.colStep) {
        isConsecutive = false;
        break;
      }
    }
    
    // 如果不连续，我们尝试其他方向
    if (!isConsecutive) {
      for (const tryDir of directions) {
        if (tryDir === dir) continue; // 跳过已尝试的方向
        
        // 重新排序并检查
        positions.sort((a, b) => {
          const primaryDiff = (a.row * tryDir.rowStep + a.col * tryDir.colStep) - 
                             (b.row * tryDir.rowStep + b.col * tryDir.colStep);
          if (primaryDiff !== 0) return primaryDiff;
          
          if (tryDir.rowStep !== 0) {
            return a.col - b.col;
          } else {
            return a.row - b.row;
          }
        });
        
        // 验证连续性
        isConsecutive = true;
        for (let i = 1; i < positions.length; i++) {
          const prev = positions[i-1];
          const curr = positions[i];
          
          if ((curr.row - prev.row) !== tryDir.rowStep || 
              (curr.col - prev.col) !== tryDir.colStep) {
            isConsecutive = false;
            break;
          }
        }
        
        if (isConsecutive) {
          dir = tryDir;
          break;
        }
      }
    }
    
    // 确保长度与单词长度匹配
    if (word.length && positions.length !== word.length) {
      console.warn(`单词符号 ${symbolStr} 位置数量(${positions.length})与单词长度(${word.length})不匹配`);
    }
    
    // 返回首尾位置
    return { 
      startRow: positions[0].row, 
      startCol: positions[0].col, 
      endRow: positions[positions.length - 1].row,
      endCol: positions[positions.length - 1].col
    };
  }
  
  // 辅助方法：转换HEX颜色为RGBA
  hexToRgba(hex, alpha) {
    // 支持缩写格式，如 #fff
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // 生成从起点到终点的所有位置
  generatePositions(startRow, startCol, endRow, endCol, direction) {
    const positions = [];
    let rowStep = 0, colStep = 0;
    let length = 0;
    
    if (startRow === endRow) {
      rowStep = 0;
      colStep = endCol > startCol ? 1 : -1;
      length = Math.abs(endCol - startCol) + 1;
    } else if (startCol === endCol) {
      rowStep = endRow > startRow ? 1 : -1;
      colStep = 0;
      length = Math.abs(endRow - startRow) + 1;
    } else {
      rowStep = endRow > startRow ? 1 : -1;
      colStep = endCol > startCol ? 1 : -1;
      length = Math.abs(endRow - startRow) + 1;
    }
    for (let i = 0; i < length; i++) {
      positions.push({ row: startRow + i * rowStep, col: startCol + i * colStep });
    }
    return positions;
  }
  
  // 导入配置文件
  importLevelConfig() {
    // 使用Electron API打开文件选择对话框
    if (window.electronAPI && window.electronAPI.openFileDialog) {
      window.electronAPI.openFileDialog({
        title: '选择关卡配置文件',
        filters: [
          { name: 'JSON文件', extensions: ['json'] }
        ],
        properties: ['openFile']
      })
      .then(result => {
        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
          console.log('用户取消了文件选择');
          return;
        }
        
        const filePath = result.filePaths[0];
        console.log('选择的文件路径:', filePath);
        
        // 读取文件内容
        return window.electronAPI.readFile(filePath)
          .then(result => {
            try {
              // 检查返回结果格式
              if (!result || typeof result !== 'object') {
                throw new Error('读取文件失败：返回结果格式错误');
              }
              
              if (!result.success) {
                throw new Error(`读取文件失败：${result.message || '未知错误'}`);
              }
              
              if (!result.content) {
                throw new Error('读取文件失败：文件内容为空');
              }
              
              // 解析JSON内容
              let levelData = JSON.parse(result.content);
              
              // 检查是否是数组格式
              if (Array.isArray(levelData) && levelData.length > 0) {
                // 使用第一个元素
                levelData = levelData[0];
              }
              
              // 检查必要的字段
              if (!levelData.grid || !levelData.words) {
                throw new Error('配置文件缺少必要的字段 (grid, words)');
              }
              
              // 转换为编辑器格式
              this.loadImportedLevelToEditor(levelData);
              
              // 导航到手动编辑界面
              this.navigateTo('editor');
              
              // 显示成功消息
              showStatusMessage('配置已成功导入', 'success');
            } catch (error) {
              console.error('解析配置文件出错:', error);
              showStatusMessage(`配置文件无效: ${error.message}`, 'error');
            }
          })
          .catch(error => {
            console.error('读取文件出错:', error);
            showStatusMessage(`读取文件出错: ${error}`, 'error');
          });
      })
      .catch(error => {
        console.error('打开文件选择对话框出错:', error);
        showStatusMessage(`打开文件选择对话框出错: ${error}`, 'error');
      });
    } else {
      console.error('Electron API 不可用，无法打开文件选择对话框');
      
      // 备用方案：使用HTML文件输入元素
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            // 解析JSON内容
            let levelData = JSON.parse(e.target.result);
            
            // 检查是否是数组格式
            if (Array.isArray(levelData) && levelData.length > 0) {
              // 使用第一个元素
              levelData = levelData[0];
            }
            
            // 检查必要的字段
            if (!levelData.grid || !levelData.words) {
              throw new Error('配置文件缺少必要的字段 (grid, words)');
            }
            
            // 转换为编辑器格式
            this.loadImportedLevelToEditor(levelData);
            
            // 导航到手动编辑界面
            this.navigateTo('editor');
            
            // 显示成功消息
            showStatusMessage('配置已成功导入', 'success');
          } catch (error) {
            console.error('解析配置文件出错:', error);
            showStatusMessage(`配置文件无效: ${error.message}`, 'error');
          }
        };
        
        reader.onerror = (error) => {
          console.error('读取文件出错:', error);
          showStatusMessage('读取文件出错', 'error');
        };
        
        reader.readAsText(file);
      });
      
      // 触发点击事件
      fileInput.click();
      
      // 使用完后移除元素
      setTimeout(() => {
        document.body.removeChild(fileInput);
      }, 5000);
    }
  }
  
  // 加载导入的关卡数据
  loadImportedLevel(levelData, filePath) {
    console.log('导入的关卡数据:', levelData);
    
    // 验证必要字段
    if (!levelData.grid || !Array.isArray(levelData.grid) || !levelData.words || !Array.isArray(levelData.words)) {
      showStatusMessage('导入的配置缺少必要的字段', 'error');
      return;
    }
    
    // 提取网格尺寸
    const rows = levelData.grid.length;
    const cols = levelData.grid[0].length;
    
    // 更新标题输入框
    document.getElementById('level-title').value = levelData.title || '';
    
    // 更新网格尺寸输入框
    document.getElementById('grid-width').value = cols;
    document.getElementById('grid-height').value = rows;
    
    // 保存完整的关卡数据，以便在创建关卡时使用
    this.importedLevelData = levelData;
    
    // 如果有文件路径，保存它
    if (filePath) {
      window.currentLevelFilePath = filePath;
    }
    
    // 显示成功消息
    showStatusMessage(`已成功导入关卡: ${levelData.title || '无标题'}`, 'success');
    
    // 导航到编辑器页面并加载数据
    this.navigateTo('editor');
    this.loadImportedLevelToEditor(levelData);
  }
  
  // 将导入的关卡数据加载到编辑器
  loadImportedLevelToEditor(levelData) {
    try {
      // 清理之前的拖拽状态
      if (window.wordListInstance && typeof window.wordListInstance.clearDragState === 'function') {
        window.wordListInstance.clearDragState();
      }
      
      // 更新标题显示
      const displayTitle = levelData.title || 'Word Search 关卡编辑器';
      document.getElementById('level-title-display').textContent = displayTitle;
      
      // 更新编辑标题输入框
      const editTitleInput = document.getElementById('edit-level-title');
      if (editTitleInput) {
        editTitleInput.value = levelData.title || '';
      }
      
      // 更新网格大小显示
      const rows = levelData.grid.length;
      const cols = levelData.grid[0] ? levelData.grid[0].length : 0;
      document.getElementById('grid-size-display').textContent = `${cols}x${rows}`;
      
      // 处理网格数据 - 将字符串数组转换为二维字符数组
      const gridData = {
        width: cols,
        height: rows,
        letters: Array(rows).fill().map((_, i) => {
          const rowString = levelData.grid[i] || '';
          return Array.from(rowString);
        })
      };
      
      // 处理单词数据，只保留有有效pos的单词
      const words = [];
      const placedWords = [];
      if (Array.isArray(levelData.words)) {
        levelData.words.forEach((wordObj, index) => {
          if (!wordObj || typeof wordObj !== 'object') return;
          // 只处理有有效pos的单词
          if (!wordObj.pos || !wordObj.pos.includes(';')) return;
          // 提取位置坐标
          let startRow = 0, startCol = 0, endRow = 0, endCol = 0;
          let direction = 'horizontal';
          let positioned = false;
          const posMatch = wordObj.pos.match(/(\d+),(\d+);(\d+),(\d+)/);
          if (posMatch) {
            startRow = parseInt(posMatch[1]);
            startCol = parseInt(posMatch[2]);
            endRow = parseInt(posMatch[3]);
            endCol = parseInt(posMatch[4]);
            positioned = true;
            if (startRow === endRow) {
              direction = startCol < endCol ? 'horizontal' : 'reverseHorizontal';
            } else if (startCol === endCol) {
              direction = startRow < endRow ? 'vertical' : 'reverseVertical';
            } else if ((endRow - startRow) === (endCol - startCol)) {
              direction = startRow < endRow ? 'diagonal' : 'reverseDiagonal';
            } else if ((endRow - startRow) === -(endCol - startCol)) {
              direction = startRow < endRow ? 'reverseDiagonal' : 'diagonal';
            }
          }
          let actualWord = wordObj.word || '';
          if (actualWord && /^[0-9!@#$%^&*()\-+={}\[\]:;<>?/]+$/.test(actualWord)) {
            actualWord = this.extractWordFromGrid(startRow, startCol, endRow, endCol, gridData.letters);
          }
          // 校验pos对应的网格字母是否和单词一致
          let valid = true;
          if (positioned && actualWord) {
            const len = actualWord.length;
            let dr = endRow === startRow ? 0 : (endRow > startRow ? 1 : -1);
            let dc = endCol === startCol ? 0 : (endCol > startCol ? 1 : -1);
            for (let k = 0; k < len; k++) {
              const rr = startRow + k * dr;
              const cc = startCol + k * dc;
              if (
                rr < 0 || rr >= gridData.height ||
                cc < 0 || cc >= gridData.width ||
                gridData.letters[rr][cc] !== actualWord[k]
              ) {
                valid = false;
                break;
              }
            }
          } else {
            valid = false;
          }
          if (!actualWord || !valid) return;
          const wordData = {
            word: actualWord,
            direction,
            id: index,
            isGold: !!wordObj.coins, // 如果有coins字段则为金币单词
            isBlackDot: !!wordObj.point // 如果有point字段则为黑点单词
          };
          if (positioned) {
            wordData.positioned = true;
            wordData.positions = this.generatePositions(startRow, startCol, endRow, endCol, direction);
            placedWords.push({...wordData});
          } else {
            words.push({...wordData});
          }
        });
      }
      
      // 处理bonus words
      const bonusWords = [];
      if (levelData.bonus && typeof levelData.bonus === 'string') {
        try {
          // 直接使用原始格式的bonus字段内容，不做额外处理
          const bonusWordsArr = levelData.bonus.split(',').map(w => w && w.trim()).filter(w => w);
          bonusWords.push(...bonusWordsArr);
          console.log('从配置文件加载奖励单词:', bonusWords);
        } catch (error) {
          console.error('处理bonus words时出错:', error);
        }
      }
      
      // 设置网格尺寸并加载数据
      if (window.gridInstance) {
        // 先设置网格大小
        window.gridInstance.setSize(cols, rows);
        
        // 检查是否有特殊单词来判断关卡类型
        const hasGoldWords = placedWords.some(word => word.isGold);
        const hasBlackDotWords = placedWords.some(word => word.isBlackDot);
        
        // 设置特殊关卡配置
        window.gridInstance.setSpecialLevelConfig({
          isGoldLevel: hasGoldWords,
          isBlackDotLevel: hasBlackDotWords
        });
        
        // 同步编辑器页面的特殊选项勾选框状态
        setTimeout(() => {
          const editorGoldLevel = document.getElementById('editor-gold-level');
          const editorBlackDotLevel = document.getElementById('editor-black-dot-level');
          const configGoldLevel = document.getElementById('gold-level');
          const configBlackDotLevel = document.getElementById('black-dot-level');
          
          if (editorGoldLevel) editorGoldLevel.checked = hasGoldWords;
          if (editorBlackDotLevel) editorBlackDotLevel.checked = hasBlackDotWords;
          if (configGoldLevel) configGoldLevel.checked = hasGoldWords;
          if (configBlackDotLevel) configBlackDotLevel.checked = hasBlackDotWords;
        }, 100);
        
        // 加载网格数据（字母）
        window.gridInstance.loadGridLetters(gridData.letters);
        
        // 加载已放置的单词和它们的位置
        if (placedWords.length > 0) {
          window.gridInstance.loadPlacedWords(placedWords);
        }
        
        // 加载bonus words - 直接使用配置中的奖励单词列表
        if (bonusWords.length > 0) {
          try {
            window.gridInstance.setBonusWords(bonusWords);
          } catch (error) {
            console.error('在setBonusWords时出错:', error);
            showStatusMessage('加载奖励单词失败，但其他数据已正常加载', 'warning');
          }
        }
      }
      
      // 加载单词列表数据
      if (window.wordListInstance) {
        window.wordListInstance.clearWords();
        // 所有单词都作为已放置单词显示
        placedWords.forEach(word => {
          if (typeof word === 'object' && word !== null) {
            const wordText = word.word;
            if (wordText) {
              window.wordListInstance.addPlacedWord(wordText);
            }
          } else if (typeof word === 'string') {
            window.wordListInstance.addPlacedWord(word);
          }
        });
        // 兼容部分批量关卡words未进placedWords的情况
        if (placedWords.length === 0 && Array.isArray(words)) {
          words.forEach(word => {
            if (typeof word === 'object' && word !== null) {
              const wordText = word.word;
              if (wordText) {
                window.wordListInstance.addPlacedWord(wordText);
              }
            } else if (typeof word === 'string') {
              window.wordListInstance.addPlacedWord(word);
            }
          });
        }
        window.wordListInstance.renderWordList();
      }
      
      // 删除多余的bonus words计数和列表更新代码，因为已经在setBonusWords中处理了
      
      console.log('已加载关卡数据到编辑器:', {
        grid: gridData,
        words: words.length,
        placedWords: placedWords.length,
        bonusWords: bonusWords.length
      });
    } catch (error) {
      console.error('加载关卡数据到编辑器时出错:', error);
      showStatusMessage('加载关卡数据失败: ' + error.message, 'error');
    }
  }
  
  // 从网格中提取实际单词
  extractWordFromGrid(startRow, startCol, endRow, endCol, gridLetters) {
    if (!gridLetters || startRow === null || startCol === null || endRow === null || endCol === null) {
      return '';
    }
    
    let word = '';
    
    // 确定方向和步长
    let rowStep = 0, colStep = 0;
    
    if (startRow === endRow) {
      // 水平方向
      colStep = startCol <= endCol ? 1 : -1;
    } else if (startCol === endCol) {
      // 垂直方向
      rowStep = startRow <= endRow ? 1 : -1;
    } else if (Math.abs(endRow - startRow) === Math.abs(endCol - startCol)) {
      // 对角线方向
      rowStep = startRow <= endRow ? 1 : -1;
      colStep = startCol <= endCol ? 1 : -1;
    } else {
      console.error('无法确定单词方向', startRow, startCol, endRow, endCol);
      return '';
    }
    
    // 计算单词长度
    let length = 0;
    if (rowStep !== 0 && colStep !== 0) {
      // 对角线
      length = Math.abs(endRow - startRow) + 1; // +1包含终点
    } else if (rowStep !== 0) {
      // 垂直
      length = Math.abs(endRow - startRow) + 1;
    } else {
      // 水平
      length = Math.abs(endCol - startCol) + 1;
    }
    
    // 提取字母
    let row = startRow, col = startCol;
    for (let i = 0; i < length; i++) {
      if (row >= 0 && row < gridLetters.length && col >= 0 && col < gridLetters[row].length) {
        word += gridLetters[row][col];
      }
      row += rowStep;
      col += colStep;
    }
    
    return word;
  }

  // 渲染指定单词关卡设置页面
  renderSingleWordsetEditor() {
    window.currentLevelFilePath = null;
    if (!this.pages.singleWordsetEditor) {
      const page = document.createElement('div');
      page.id = 'single-wordset-editor-page';
      page.className = 'page';
      document.body.appendChild(page);
      this.pages.singleWordsetEditor = page;
    }
    // 填充设置表单，增加生成数量输入框
    this.pages.singleWordsetEditor.innerHTML = `
      <div class="container">
        <button id="singleWordsetBackHome" class="back-btn">&#10094; 返回首页</button>
        <h2>指定单词关卡 - 设置</h2>
        <div class="form-group">
          <label for="singleWordsetTitle">关卡标题：</label>
          <input id="singleWordsetTitle" class="input-field" placeholder="关卡标题" />
        </div>
        <div class="form-row compact">
          <div class="form-group half">
            <label for="singleWordsetRows">行数：</label>
            <input id="singleWordsetRows" class="input-field" type="number" min="5" max="20" value="10" />
          </div>
          <div class="form-group half">
            <label for="singleWordsetCols">列数：</label>
            <input id="singleWordsetCols" class="input-field" type="number" min="5" max="20" value="10" />
          </div>
        </div>
        <div class="form-group">
          <label for="singleWordsetCount">生成数量：</label>
          <input id="singleWordsetCount" class="input-field" type="number" min="1" max="20" value="1" />
        </div>
        <div class="form-group">
          <label for="singleWordsetWords">单词列表（每行一个）：</label>
          <textarea id="singleWordsetWords" class="input-field" rows="8" placeholder="如：\nCAT\nDOG\nFISH"></textarea>
        </div>
        <button id="generateSingleWordsetBtn" class="primary-btn">生成关卡</button>
        <div id="singleWordsetResultArea" class="result-area"></div>
      </div>
    `;
    // 绑定事件
    document.getElementById('singleWordsetBackHome').addEventListener('click', () => {
      this.navigateTo('home');
    });
    document.getElementById('generateSingleWordsetBtn').addEventListener('click', () => {
      this.handleGenerateSingleWordset();
    });
    
    // 为单词输入textarea添加自动转大写功能
    const singleWordsetWords = document.getElementById('singleWordsetWords');
    if (singleWordsetWords) {
      singleWordsetWords.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        e.target.value = e.target.value.toUpperCase();
        e.target.setSelectionRange(cursorPosition, cursorPosition);
      });
    }
  }

  // 生成指定单词关卡并跳转展示（批量）
  handleGenerateSingleWordset() {
    const title = document.getElementById('singleWordsetTitle').value.trim() || '指定单词关卡';
    const rows = parseInt(document.getElementById('singleWordsetRows').value, 10);
    const cols = parseInt(document.getElementById('singleWordsetCols').value, 10);
    const count = Math.max(1, Math.min(20, parseInt(document.getElementById('singleWordsetCount').value, 10) || 1));
    const wordsRaw = document.getElementById('singleWordsetWords').value;
    const resultArea = document.getElementById('singleWordsetResultArea');
    // 校验
    if (isNaN(rows) || isNaN(cols) || rows < 5 || cols < 5 || rows > 20 || cols > 20) {
      resultArea.innerHTML = '<div class="error-message">行数和列数必须在5到20之间</div>';
      return;
    }
    const words = wordsRaw.split(/\r?\n/).map(w => w.trim().toUpperCase()).filter(w => w);
    if (words.length === 0) {
      resultArea.innerHTML = '<div class="error-message">请至少输入一个单词</div>';
      return;
    }
    // 批量生成关卡
    try {
      this.singleWordsetLevels = [];
      for (let i = 0; i < count; i++) {
        const levelData = this.generateWordSearchLevel({ title: `${title} ${count > 1 ? (i+1) : ''}`, rows, cols, words });
        this.singleWordsetLevels.push({
          title: levelData.title,
          grid: levelData.grid.letters.map(row => row.join('')),
          words: levelData.words,
          bonus: levelData.bonus,
          type: 1,
          id: levelData.id
        });
      }
      this.currentSingleWordsetIndex = 0;
      this.lastEditorSource = 'singleWordset';
      this.navigateTo('editor');
      this.resetEditorState();
      this.loadImportedLevelToEditor(this.singleWordsetLevels[0]);
      this.updateSingleWordsetEditorNav();
    } catch (e) {
      resultArea.innerHTML = `<div class="error-message">生成失败: ${e.message}</div>`;
    }
  }

  // 生成算法（简化版，后续可优化）
  generateWordSearchLevel({ title, rows, cols, words }) {
    // 初始化空网格
    const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
    const placedWords = [];
    // 按单词长度降序排列，优先放长单词
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const directions = [
      { name: 'horizontal', dr: 0, dc: 1 },
      { name: 'vertical', dr: 1, dc: 0 },
      { name: 'diagonal', dr: 1, dc: 1 },
      { name: 'reverseHorizontal', dr: 0, dc: -1 },
      { name: 'reverseVertical', dr: -1, dc: 0 },
      { name: 'reverseDiagonal', dr: 1, dc: -1 }
    ];
    for (const word of sortedWords) {
      let placed = false;
      for (let attempt = 0; attempt < 100 && !placed; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        // 随机起点
        const maxRow = dir.dr === 0 ? rows : rows - word.length * Math.abs(dir.dr) + (dir.dr < 0 ? 1 : 0);
        const maxCol = dir.dc === 0 ? cols : cols - word.length * Math.abs(dir.dc) + (dir.dc < 0 ? 1 : 0);
        const startRow = dir.dr >= 0 ? Math.floor(Math.random() * (maxRow)) : Math.floor(Math.random() * (rows - word.length + 1)) + word.length - 1;
        const startCol = dir.dc >= 0 ? Math.floor(Math.random() * (maxCol)) : Math.floor(Math.random() * (cols - word.length + 1)) + word.length - 1;
        // 检查是否可放置
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = startRow + i * dir.dr;
          const c = startCol + i * dir.dc;
          if (r < 0 || r >= rows || c < 0 || c >= cols) { canPlace = false; break; }
          if (grid[r][c] && grid[r][c] !== word[i]) { canPlace = false; break; }
        }
        if (!canPlace) continue;
        // 放置
        const positions = [];
        for (let i = 0; i < word.length; i++) {
          const r = startRow + i * dir.dr;
          const c = startCol + i * dir.dc;
          grid[r][c] = word[i];
          positions.push({ row: r, col: c });
        }
        placedWords.push({ word, positions, direction: dir.name });
        placed = true;
      }
      if (!placed) throw new Error(`单词"${word}"无法放入网格，请调整网格大小或减少单词数量`);
    }
    // 填充空白
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c]) {
          grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
    // 检测奖励单词（可用已有detectBonusWords逻辑）
    let bonusWords = [];
    if (typeof this.detectBonusWords === 'function') {
      bonusWords = this.detectBonusWords(grid, words);
    }
    // 返回关卡数据
    return {
      title,
      level: 1, // 添加默认level值
      grid: {
        width: cols,
        height: rows,
        letters: grid,
        placedWords
      },
      words: placedWords.map(w => ({ word: w.word, pos: `${w.positions[0].row},${w.positions[0].col};${w.positions[w.positions.length-1].row},${w.positions[w.positions.length-1].col}` })),
      bonus: bonusWords.join(','),
      type: 1,
      id: 'WS' + Math.random().toString(36).substring(2, 8).toUpperCase()
    };
  }

  // 展示指定单词关卡
  renderSingleWordsetPreview(levelData) {
    if (!this.pages.singleWordsetPreview) {
      const page = document.createElement('div');
      page.id = 'single-wordset-preview-page';
      page.className = 'page';
      document.body.appendChild(page);
      this.pages.singleWordsetPreview = page;
    }
    // 颜色列表
    const colors = [
      '#8e44ad', '#e74c3c', '#27ae60', '#2980b9', '#f39c12', '#d35400', '#16a085', '#f1c40f', '#c0392b', '#2c3e50', '#7f8c8d'
    ];
    // 单词chip标签
    const wordChipsHtml = levelData.words.map((w, idx) =>
      `<span class="word-chip" data-word-idx="${idx}" style="background:${colors[idx % colors.length]};">${w.word}</span>`
    ).join(' ');
    // 奖励单词
    const bonusHtml = levelData.bonus ? levelData.bonus.split(',').map(w => `<span class='bonus-word-preview'>${w}</span>`).join('、') : '无';
    // 渲染网格（每个单词单元格加data-word-idx）
    const grid = levelData.grid.letters;
    const rows = grid.length;
    const cols = grid[0].length;
    let cellSize = Math.min(40, Math.floor(240 / Math.max(rows, cols)));
    let gridHtml = '<table class="preview-grid-table" style="margin:0 auto;">';
    for (let i = 0; i < rows; i++) {
      gridHtml += '<tr>';
      for (let j = 0; j < cols; j++) {
        // 判断该格是否属于某个单词
        let wordIdx = -1;
        levelData.words.forEach((w, idx) => {
          const [start, end] = w.pos.split(';');
          if (!start || !end) return;
          const [sr, sc] = start.split(',').map(Number);
          const [er, ec] = end.split(',').map(Number);
          let len = w.word.length;
          let dr = er === sr ? 0 : (er > sr ? 1 : -1);
          let dc = ec === sc ? 0 : (ec > sc ? 1 : -1);
          for (let k = 0; k < len; k++) {
            if (i === sr + k * dr && j === sc + k * dc) {
              wordIdx = idx;
            }
          }
        });
        gridHtml += `<td><div class="preview-cell" data-row="${i}" data-col="${j}"${wordIdx>=0?` data-word-idx="${wordIdx}" style="background:${colors[wordIdx%colors.length]}22;border-radius:12px;font-weight:bold;"`:''}>${grid[i][j]}</div></td>`;
      }
      gridHtml += '</tr>';
    }
    gridHtml += '</table>';
    // 页面结构
    this.pages.singleWordsetPreview.innerHTML = `
      <div class="preview-card" style="max-width:600px;margin:40px auto 0 auto;background:#fff;border-radius:18px;box-shadow:0 4px 24px #0001;padding:32px 32px 24px 32px;">
        <button id="singleWordsetPreviewBack" class="back-btn" style="position:absolute;left:24px;top:24px;">&#10094; 返回设置</button>
        <button id="singleWordsetPreviewExport" class="primary-btn" style="position:absolute;right:24px;top:24px;">导出关卡</button>
        <h2 style="text-align:center;color:#223;letter-spacing:1px;margin-bottom:18px;">Word Search 关卡</h2>
        <div style="text-align:center;margin-bottom:18px;">
          <span style="color:#888;font-size:16px;">${levelData.title}</span>
        </div>
        <div style="text-align:center;margin-bottom:18px;">${wordChipsHtml}</div>
        <div style="display:flex;justify-content:center;align-items:center;">
          <div style="background:#fafbfc;border-radius:16px;padding:18px 18px 12px 18px;box-shadow:0 2px 8px #0001;">
            ${gridHtml}
          </div>
        </div>
        <div style="margin-top:18px;text-align:center;color:#666;font-size:15px;">
          <strong>奖励单词：</strong>${bonusHtml}
        </div>
      </div>
    `;
    // 绑定返回
    document.getElementById('singleWordsetPreviewBack').addEventListener('click', () => {
      this.navigateTo('singleWordsetEditor');
    });
    // 绑定导出
    document.getElementById('singleWordsetPreviewExport').addEventListener('click', () => {
      // 导出为json
      const exportObj = {
        level: levelData.level || 1, // 使用关卡中已有的level或默认值1
        title: levelData.title,
        type: 1,
        grid: levelData.grid.letters.map(row => row.join('')),
        words: levelData.words,
        sentence: '',
        bonus: levelData.bonus,
        id: levelData.id
      };
      const blob = new Blob([JSON.stringify([exportObj], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level_${levelData.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    // 单词chip高亮交互
    document.querySelectorAll('.word-chip').forEach((chip, idx) => {
      chip.addEventListener('mouseenter', () => {
        document.querySelectorAll(`.preview-cell[data-word-idx="${idx}"]`).forEach(cell => {
          cell.style.background = colors[idx % colors.length] + '66';
          cell.style.color = '#fff';
        });
        chip.style.boxShadow = `0 0 0 4px ${colors[idx % colors.length]}33`;
      });
      chip.addEventListener('mouseleave', () => {
        document.querySelectorAll(`.preview-cell[data-word-idx="${idx}"]`).forEach(cell => {
          cell.style.background = colors[idx % colors.length] + '22';
          cell.style.color = '';
        });
        chip.style.boxShadow = '';
      });
    });
  }

  // 渲染单词连线
  renderSingleWordsetLines(levelData) {
    const svg = document.getElementById('single-wordset-preview-lines');
    if (!svg) return;
    svg.innerHTML = '';
    const gridTable = document.querySelector('.preview-grid-table');
    if (!gridTable) return;
    // 获取所有单元格
    const cellMap = {};
    document.querySelectorAll('.preview-cell').forEach(cell => {
      const row = parseInt(cell.getAttribute('data-row'), 10);
      const col = parseInt(cell.getAttribute('data-col'), 10);
      cellMap[`${row},${col}`] = cell;
    });
    // 颜色列表
    const colors = [
      '#e74c3c', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#d35400', '#16a085', '#f1c40f', '#c0392b', '#2c3e50', '#7f8c8d'
    ];
    // 绘制每个单词的连线
    levelData.words.forEach((w, idx) => {
      const [start, end] = w.pos.split(';');
      if (!start || !end) return;
      const [startRow, startCol] = start.split(',').map(Number);
      const [endRow, endCol] = end.split(',').map(Number);
      const startCell = cellMap[`${startRow},${startCol}`];
      const endCell = cellMap[`${endRow},${endCol}`];
      if (!startCell || !endCell) return;
      // 获取中心点
      const getCenter = cell => {
        const rect = cell.getBoundingClientRect();
        const parentRect = gridTable.getBoundingClientRect();
        return {
          x: rect.left - parentRect.left + rect.width / 2,
          y: rect.top - parentRect.top + rect.height / 2
        };
      };
      const p1 = getCenter(startCell);
      const p2 = getCenter(endCell);
      // 绘制线
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('stroke', colors[idx % colors.length]);
      line.setAttribute('stroke-width', 8);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', '0.45');
      line.setAttribute('data-word-idx', idx);
      svg.appendChild(line);
      // 端点圆
      [p1, p2].forEach(p => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', 10);
        circle.setAttribute('fill', colors[idx % colors.length]);
        circle.setAttribute('opacity', '0.7');
        circle.setAttribute('data-word-idx', idx);
        svg.appendChild(circle);
      });
    });
  }

  // 绑定交互高亮
  bindSingleWordsetPreviewEvents(levelData) {
    // 单词列表高亮
    document.querySelectorAll('.preview-word-item').forEach((li, idx) => {
      li.addEventListener('mouseenter', () => {
        this.highlightSingleWordsetWord(idx, true);
      });
      li.addEventListener('mouseleave', () => {
        this.highlightSingleWordsetWord(idx, false);
      });
    });
  }

  // 高亮单词及线条
  highlightSingleWordsetWord(idx, highlight) {
    // 高亮线条
    document.querySelectorAll(`#single-wordset-preview-lines [data-word-idx="${idx}"]`).forEach(el => {
      el.setAttribute('opacity', highlight ? '1' : '0.45');
      if (el.tagName === 'line') el.setAttribute('stroke-width', highlight ? '14' : '8');
      if (el.tagName === 'circle') el.setAttribute('r', highlight ? '14' : '10');
    });
    // 高亮单元格
    document.querySelectorAll(`.preview-cell`).forEach(cell => {
      if (cell.getAttribute('data-word-idx') == idx) {
        cell.style.background = highlight ? 'rgba(255,255,0,0.25)' : '';
        cell.style.fontWeight = highlight ? 'bold' : '';
      }
    });
    // 高亮单词列表项
    document.querySelectorAll('.preview-word-item').forEach((li, i) => {
      if (i === idx) {
        li.style.background = highlight ? 'rgba(255,255,0,0.15)' : '';
      }
    });
  }

  // 在主编辑器页面增加上一关/下一关按钮，支持切换
  updateSingleWordsetEditorNav() {
    // 确保按钮只添加一次
    if (document.getElementById('singleWordsetPrevBtn')) return;
    const controls = document.querySelector('.file-controls');
    if (!controls) return;
    // 创建按钮容器
    const navGroup = document.createElement('div');
    navGroup.id = 'singleWordsetNavGroup';
    navGroup.style.display = 'inline-flex';
    navGroup.style.alignItems = 'center';
    navGroup.style.marginRight = '16px';
    // 创建按钮
    const prevBtn = document.createElement('button');
    prevBtn.id = 'singleWordsetPrevBtn';
    prevBtn.textContent = '上一关';
    prevBtn.style.background = '#888';
    const nextBtn = document.createElement('button');
    nextBtn.id = 'singleWordsetNextBtn';
    nextBtn.textContent = '下一关';
    nextBtn.style.background = '#888';
    nextBtn.style.marginLeft = '8px';
    // 状态显示
    let statusSpan = document.getElementById('singleWordsetNavStatus');
    if (!statusSpan) {
      statusSpan = document.createElement('span');
      statusSpan.id = 'singleWordsetNavStatus';
      statusSpan.style.margin = '0 12px';
    }
    navGroup.appendChild(prevBtn);
    navGroup.appendChild(statusSpan);
    navGroup.appendChild(nextBtn);
    // 插入到 file-controls 最前面
    controls.insertBefore(navGroup, controls.firstChild);
    // 更新状态
    const updateStatus = () => {
      statusSpan.textContent = `关卡 ${this.currentSingleWordsetIndex + 1} / ${this.singleWordsetLevels.length}`;
      prevBtn.disabled = this.currentSingleWordsetIndex === 0;
      nextBtn.disabled = this.currentSingleWordsetIndex === this.singleWordsetLevels.length - 1;
    };
    updateStatus();
    // 切换事件
    prevBtn.onclick = () => {
      this.saveCurrentSingleWordsetLevel();
      if (this.currentSingleWordsetIndex > 0) {
        this.currentSingleWordsetIndex--;
        this.resetEditorState();
        this.loadImportedLevelToEditor(this.singleWordsetLevels[this.currentSingleWordsetIndex]);
        updateStatus();
      }
    };
    nextBtn.onclick = () => {
      this.saveCurrentSingleWordsetLevel();
      if (this.currentSingleWordsetIndex < this.singleWordsetLevels.length - 1) {
        this.currentSingleWordsetIndex++;
        this.resetEditorState();
        this.loadImportedLevelToEditor(this.singleWordsetLevels[this.currentSingleWordsetIndex]);
        updateStatus();
      }
    };
  }

  // 保存当前编辑器内容到 singleWordsetLevels
  saveCurrentSingleWordsetLevel() {
    if (!this.singleWordsetLevels || !Array.isArray(this.singleWordsetLevels)) return;
    const idx = this.currentSingleWordsetIndex;
    if (typeof idx !== 'number' || idx < 0 || idx >= this.singleWordsetLevels.length) return;
    // 从 gridInstance 获取当前网格和单词数据
    if (window.gridInstance) {
      const gridData = window.gridInstance.getGridData();
      this.singleWordsetLevels[idx].grid = gridData.letters.map(row => row.join(''));
      this.singleWordsetLevels[idx].words = gridData.placedWords.map(w => ({
        word: w.word,
        pos: `${w.positions[0].row},${w.positions[0].col};${w.positions[w.positions.length-1].row},${w.positions[w.positions.length-1].col}`
      }));
    }
    // 可扩展保存bonus等
  }

  // 重置主编辑器所有状态，防止关卡切换残留
  resetEditorState() {
    // 清空网格和单词
    if (window.gridInstance && typeof window.gridInstance.resetGrid === 'function') {
      window.gridInstance.resetGrid({silent:true});
    }
    if (window.wordListInstance && typeof window.wordListInstance.clearWords === 'function') {
      window.wordListInstance.clearWords();
    }
    // 清空奖励单词
    window.bonusWordsData = { words: [], wordsWithPositions: [] };
    // 清空bonus相关UI
    const bonusList = document.getElementById('bonus-words');
    if (bonusList) bonusList.innerHTML = '';
    // 清空SVG划线（如有）
    const svgLines = document.querySelectorAll('.word-lines-container, #preview-word-lines, #single-wordset-preview-lines');
    svgLines.forEach(svg => svg.innerHTML = '');
    // 清空预览页面内容（如有）
    const previewGrid = document.getElementById('preview-grid');
    if (previewGrid) previewGrid.innerHTML = '';
    const previewWordList = document.getElementById('preview-word-list');
    if (previewWordList) previewWordList.innerHTML = '';
    // 清空主编辑器页面的单词列表
    const placedWordsList = document.getElementById('placed-words');
    if (placedWordsList) placedWordsList.innerHTML = '';
    // 清空状态消息
    const statusEl = document.getElementById('status-message');
    if (statusEl) statusEl.textContent = '';
    // 其他自定义清理
    // ...
  }

  // 向Navigation类中添加goToConfigPage方法
  goToConfigPage() {
    window.currentLevelFilePath = null;
    console.log('返回配置页面');
    this.navigateTo('levelConfig');
  }

  // 添加goToLevelListPage方法，确保每次访问时都重新加载关卡列表
  goToLevelListPage() {
    window.currentLevelFilePath = null;
    console.log('进入关卡列表页面，重新加载关卡数据');
    this.navigateTo('levelList');
    // 重新加载关卡列表数据，确保获取最新数据
    this.loadLevelList();
  }
  
  // 同步特殊选项状态（编辑器页面和配置页面之间）
  syncSpecialOptions() {
    const editorGoldLevel = document.getElementById('editor-gold-level');
    const editorBlackDotLevel = document.getElementById('editor-black-dot-level');
    const configGoldLevel = document.getElementById('gold-level');
    const configBlackDotLevel = document.getElementById('black-dot-level');
    
    // 如果编辑器页面的选项存在且不同于配置页面，则同步配置页面
    if (editorGoldLevel && configGoldLevel && editorGoldLevel.checked !== configGoldLevel.checked) {
      configGoldLevel.checked = editorGoldLevel.checked;
    }
    
    if (editorBlackDotLevel && configBlackDotLevel && editorBlackDotLevel.checked !== configBlackDotLevel.checked) {
      configBlackDotLevel.checked = editorBlackDotLevel.checked;
    }
    
    // 反向同步：如果配置页面的选项改变，也要更新编辑器页面
    if (configGoldLevel && editorGoldLevel && configGoldLevel.checked !== editorGoldLevel.checked) {
      editorGoldLevel.checked = configGoldLevel.checked;
    }
    
    if (configBlackDotLevel && editorBlackDotLevel && configBlackDotLevel.checked !== editorBlackDotLevel.checked) {
      editorBlackDotLevel.checked = configBlackDotLevel.checked;
    }
  }
  
  // 获取当前特殊关卡配置
  getCurrentSpecialConfig() {
    const editorGoldLevel = document.getElementById('editor-gold-level');
    const editorBlackDotLevel = document.getElementById('editor-black-dot-level');
    const configGoldLevel = document.getElementById('gold-level');
    const configBlackDotLevel = document.getElementById('black-dot-level');
    
    return {
      isGoldLevel: editorGoldLevel ? editorGoldLevel.checked : (configGoldLevel ? configGoldLevel.checked : false),
      isBlackDotLevel: editorBlackDotLevel ? editorBlackDotLevel.checked : (configBlackDotLevel ? configBlackDotLevel.checked : false)
    };
  }
  
  // 绑定编辑器页面特殊选项的事件监听
  bindEditorSpecialOptions() {
    // 使用延迟绑定，因为编辑器页面的元素可能还没有创建
    setTimeout(() => {
      const editorGoldLevel = document.getElementById('editor-gold-level');
      const editorBlackDotLevel = document.getElementById('editor-black-dot-level');
      
      if (editorGoldLevel) {
        editorGoldLevel.addEventListener('change', () => {
          this.syncSpecialOptions();
          // 如果网格实例存在，更新特殊关卡配置
          if (window.gridInstance && typeof window.gridInstance.setSpecialLevelConfig === 'function') {
            window.gridInstance.setSpecialLevelConfig(this.getCurrentSpecialConfig());
          }
        });
      }
      
      if (editorBlackDotLevel) {
        editorBlackDotLevel.addEventListener('change', () => {
          this.syncSpecialOptions();
          // 如果网格实例存在，更新特殊关卡配置
          if (window.gridInstance && typeof window.gridInstance.setSpecialLevelConfig === 'function') {
            window.gridInstance.setSpecialLevelConfig(this.getCurrentSpecialConfig());
          }
        });
      }
      
      // 同时绑定配置页面的选项，确保双向同步
      const configGoldLevel = document.getElementById('gold-level');
      const configBlackDotLevel = document.getElementById('black-dot-level');
      
      if (configGoldLevel) {
        configGoldLevel.addEventListener('change', () => {
          this.syncSpecialOptions();
        });
      }
      
      if (configBlackDotLevel) {
        configBlackDotLevel.addEventListener('change', () => {
          this.syncSpecialOptions();
        });
      }
    }, 100);
  }

  // 打开配置文件夹
  async openConfigFolder() {
    try {
      console.log('尝试打开配置文件夹...');
      const result = await window.electronAPI.openConfigFolder();
      
      if (result.success) {
        console.log('配置文件夹已打开:', result.path);
        
        // 显示成功提示
        this.showNotification('配置文件夹已打开！您可以在其中找到并编辑 lv1_500.json 文件', 'success');
      } else {
        console.error('打开配置文件夹失败:', result.message);
        this.showNotification('打开配置文件夹失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('打开配置文件夹时发生错误:', error);
      this.showNotification('打开配置文件夹时发生错误', 'error');
    }
  }

  // 显示通知消息
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 样式
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // 初始化批量导出事件
  initBatchExportEvents() {
    // 批量导出切换按钮
    const batchToggleBtn = document.getElementById('batch-export-toggle-btn');
    if (batchToggleBtn) {
      batchToggleBtn.addEventListener('click', () => {
        this.showBatchExportModal();
      });
    }
    
    // 模态框相关事件
    this.initBatchModalEvents();
  }
  
  // 初始化模态框事件
  initBatchModalEvents() {
    const modal = document.getElementById('batch-export-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-batch-export');
    const exportBtn = document.getElementById('batch-export-btn');
    const selectAllCheckbox = document.getElementById('select-all-levels');
    
    // 关闭模态框事件
    closeBtn.addEventListener('click', () => this.closeBatchExportModal());
    cancelBtn.addEventListener('click', () => this.closeBatchExportModal());
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeBatchExportModal();
      }
    });
    
    // 全选复选框事件
    selectAllCheckbox.addEventListener('change', (e) => {
      this.toggleBatchSelectAll(e.target.checked);
    });
    
    // 导出按钮事件
    exportBtn.addEventListener('click', () => {
      this.batchExportLevels();
    });
  }
  
  // 显示批量导出模态框
  showBatchExportModal() {
    if (!this.levelsData || this.levelsData.length === 0) {
      showStatusMessage('没有可导出的关卡', 'warning');
      return;
    }
    
    this.populateBatchLevelList();
    document.getElementById('batch-export-modal').classList.add('active');
  }
  
  // 关闭批量导出模态框
  closeBatchExportModal() {
    document.getElementById('batch-export-modal').classList.remove('active');
  }
  
  // 填充模态框中的关卡列表
  populateBatchLevelList() {
    const batchLevelList = document.getElementById('batch-level-list');
    batchLevelList.innerHTML = '';
    
    this.levelsData.forEach((level, index) => {
      const item = this.createBatchLevelItem(level, index);
      batchLevelList.appendChild(item);
    });
    
    this.updateBatchSelectionState();
  }
  
  // 创建批量选择列表项
  createBatchLevelItem(levelData, index) {
    const item = document.createElement('div');
    item.className = 'batch-level-item';
    item.dataset.levelIndex = index;
    
    const levelId = levelData.id || levelData._filePath || '';
    
    item.innerHTML = `
      <label class="checkbox-label batch-level-checkbox">
        <input type="checkbox" data-level-id="${levelId}">
        <span class="checkmark"></span>
      </label>
      <div class="batch-level-info">
        <div class="batch-level-title">
          ${levelData.title || 'Untitled Level'}
          ${levelData.level ? `<span class="level-badge">Level ${levelData.level}</span>` : ''}
        </div>
        <div class="batch-level-meta">
          ${levelData.metadata?.createdAt ? `创建于: ${new Date(levelData.metadata.createdAt).toLocaleString()}` : ''}
          ${levelData.grid ? ` | 大小: ${levelData.grid.width}x${levelData.grid.height}` : ''}
          ${levelData.wordList?.words ? ` | 单词数: ${levelData.wordList.words.length}` : (levelData.words ? ` | 单词数: ${levelData.words.length}` : '')}
        </div>
      </div>
    `;
    
    // 绑定点击事件
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    // 整个项目点击切换选择状态
    item.addEventListener('click', (e) => {
      // 如果点击的是复选框本身，不需要额外处理
      if (e.target.type === 'checkbox') {
        return;
      }
      
      // 点击其他地方时切换复选框状态
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    });
    
    // 复选框变化事件
    checkbox.addEventListener('change', () => {
      this.toggleBatchLevelSelection(item, checkbox.checked);
      this.updateBatchSelectionState();
    });
    
    return item;
  }
  
  // 切换批量选择项的视觉状态
  toggleBatchLevelSelection(item, checked) {
    if (checked) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  }
  
  // 全选/取消全选
  toggleBatchSelectAll(checked) {
    document.querySelectorAll('.batch-level-list input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = checked;
      const item = checkbox.closest('.batch-level-item');
      this.toggleBatchLevelSelection(item, checked);
    });
    this.updateBatchSelectionState();
  }
  
  // 更新批量选择状态
  updateBatchSelectionState() {
    const checkboxes = document.querySelectorAll('.batch-level-list input[type="checkbox"]');
    const selectedCheckboxes = document.querySelectorAll('.batch-level-list input[type="checkbox"]:checked');
    const selectAllCheckbox = document.getElementById('select-all-levels');
    const selectedCount = document.getElementById('selected-count');
    const batchExportBtn = document.getElementById('batch-export-btn');
    
    // 更新选择计数
    if (selectedCount) {
      selectedCount.textContent = `已选择 ${selectedCheckboxes.length} 个关卡`;
    }
    
    // 更新全选复选框状态
    if (selectAllCheckbox) {
      if (selectedCheckboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (selectedCheckboxes.length === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
      }
    }
    
    // 更新批量导出按钮状态
    if (batchExportBtn) {
      batchExportBtn.disabled = selectedCheckboxes.length === 0;
    }
  }
  
  // 批量导出选中的关卡
  async batchExportLevels() {
    const selectedCheckboxes = document.querySelectorAll('.batch-level-list input[type="checkbox"]:checked');
    
    console.log('🔍 批量导出调试信息:');
    console.log('选中的复选框数量:', selectedCheckboxes.length);
    console.log('选中的复选框:', Array.from(selectedCheckboxes).map(cb => ({
      levelId: cb.dataset.levelId,
      checked: cb.checked
    })));
    
    if (selectedCheckboxes.length === 0) {
      showStatusMessage('请至少选择一个关卡进行导出', 'warning');
      return;
    }
    
    const batchExportBtn = document.getElementById('batch-export-btn');
    const originalText = batchExportBtn.textContent;
    
    try {
      // 显示导出进度
      batchExportBtn.textContent = `正在导出 ${selectedCheckboxes.length} 个关卡...`;
      batchExportBtn.disabled = true;
      
      // 收集选中的关卡数据
      const selectedLevels = [];
      for (const checkbox of selectedCheckboxes) {
        const levelId = checkbox.dataset.levelId;
        console.log('查找关卡ID:', levelId);
        
        const levelData = this.levelsData.find(level => 
          (level.id && level.id === levelId) || 
          (level._filePath && level._filePath === levelId)
        );
        
        if (levelData) {
          selectedLevels.push(levelData);
          console.log('找到关卡数据:', {
            title: levelData.title,
            id: levelData.id,
            level: levelData.level,
            filePath: levelData._filePath
          });
        } else {
          console.warn('未找到关卡数据，ID:', levelId);
        }
      }
      
      console.log('收集到的关卡数据数量:', selectedLevels.length);
      console.log('关卡列表:', selectedLevels.map(l => ({ title: l.title, id: l.id, level: l.level })));
      
      if (selectedLevels.length === 0) {
        throw new Error('未找到有效的关卡数据');
      }
      
      // 更新进度显示
      batchExportBtn.textContent = `正在处理 ${selectedLevels.length} 个关卡...`;
      
      // 收集所有关卡的导出数据
      const allExportData = [];
      
      for (let i = 0; i < selectedLevels.length; i++) {
        const levelData = selectedLevels[i];
        
        console.log(`📤 处理第 ${i + 1} 个关卡:`, levelData.title);
        
        // 更新进度
        batchExportBtn.textContent = `正在处理 ${i + 1}/${selectedLevels.length}: ${levelData.title}`;
        
        // 准备导出数据
        const exportData = this.prepareLevelForExport(levelData);
        allExportData.push(exportData);
        
        console.log('关卡数据预览:', {
          level: exportData.level,
          title: exportData.title,
          wordsCount: exportData.words.length,
          gridSize: `${exportData.grid[0]?.length}x${exportData.grid.length}`
        });
      }
      
      console.log('🔄 收集完成，准备合并导出:', allExportData.length, '个关卡');
      
      // 生成合并文件名
      const timestamp = Date.now();
      const fileName = `batch_levels_${selectedLevels.length}_${timestamp}.json`;
      
      console.log(`📁 生成合并文件名: ${fileName}`);
      
      // 创建并下载合并的配置文件
      const blob = new Blob([JSON.stringify(allExportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ 合并文件 ${fileName} 已触发下载`);
      console.log('🎉 批量导出完成!');
      
      // 显示成功消息
      showStatusMessage(`成功导出 ${selectedLevels.length} 个关卡到文件: ${fileName}`, 'success');
      
      // 关闭模态框
      this.closeBatchExportModal();
      
    } catch (error) {
      console.error('批量导出失败:', error);
      showStatusMessage(`导出失败: ${error.message}`, 'error');
    } finally {
      // 恢复按钮状态
      batchExportBtn.textContent = originalText;
      batchExportBtn.disabled = false; // 导出完成后重新启用按钮
    }
  }
  
  // 准备关卡数据用于导出
  prepareLevelForExport(levelData) {
    try {
      console.log('准备导出关卡数据:', levelData);
      
      // 将网格数据转换为字符串数组格式
      let gridStrings = [];
      
      if (levelData.grid) {
        if (Array.isArray(levelData.grid) && typeof levelData.grid[0] === 'string') {
          // 已经是字符串数组格式
          gridStrings = levelData.grid;
        } else if (Array.isArray(levelData.grid) && Array.isArray(levelData.grid[0])) {
          // 二维数组格式，转换为字符串数组
          gridStrings = levelData.grid.map(row => 
            Array.isArray(row) ? row.join('') : String(row)
          );
        } else if (levelData.grid.letters && Array.isArray(levelData.grid.letters)) {
          // Grid对象格式（编辑器保存的格式）
          gridStrings = levelData.grid.letters.map(row => row.join(''));
        }
      }
      
      // 处理单词列表
      let words = [];
      
      // 优先从grid.placedWords中获取单词和位置信息（编辑器格式）
      if (levelData.grid && levelData.grid.placedWords && Array.isArray(levelData.grid.placedWords)) {
        console.log('从grid.placedWords提取单词:', levelData.grid.placedWords);
        words = levelData.grid.placedWords.map(wordData => {
          // 计算起始和结束位置
          const positions = wordData.positions || [];
          let pos = "";
          if (positions.length > 0) {
            const startPos = positions[0];
            const endPos = positions[positions.length - 1];
            pos = `${startPos.row},${startPos.col};${endPos.row},${endPos.col}`;
          }
          
          const exportWord = {
            word: wordData.word,
            pos: pos
          };
          
          // 添加特殊标记信息
          if (wordData.isGold) {
            exportWord.coins = `0,${wordData.word.length - 1}`;
          }
          if (wordData.isBlackDot) {
            exportWord.point = `0,${wordData.word.length - 1}`;
          }
          
          return exportWord;
        });
      }
      // 如果没有grid.placedWords，尝试从其他格式提取
      else if (levelData.words && Array.isArray(levelData.words)) {
        console.log('从words字段提取单词:', levelData.words);
        // 已经是正确格式的words数组
        words = levelData.words.filter(w => w && (w.word || typeof w === 'string')).map(wordItem => {
          if (typeof wordItem === 'string') {
            return { word: wordItem, pos: "" };
          } else {
            return {
              word: wordItem.word || "",
              pos: wordItem.pos || ""
            };
          }
        });
      }
      // 从wordList.words提取（可能是字符串数组）
      else if (levelData.wordList && levelData.wordList.words && Array.isArray(levelData.wordList.words)) {
        console.log('从wordList.words提取单词:', levelData.wordList.words);
        words = levelData.wordList.words.map(wordItem => {
          if (typeof wordItem === 'string') {
            // 如果是字符串数组，需要从网格中查找位置
            return { word: wordItem, pos: "" };
          } else if (wordItem && wordItem.word) {
            return {
              word: wordItem.word,
              pos: wordItem.pos || ""
            };
          } else {
            return { word: "", pos: "" };
          }
        }).filter(w => w.word); // 过滤掉空单词
      }
      
      console.log('处理后的单词列表:', words);
      
      // 获取关卡ID
      const levelId = levelData.id || 
                     (levelData._filePath ? levelData._filePath.match(/level_([^\.]+)\.json$/)?.[1] : '') ||
                     'WS' + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      // 创建标准格式的关卡配置
      const exportConfig = {
        level: parseInt(levelData.level) || 1,
        title: levelData.title || levelData.name || 'Untitled Level',
        type: levelData.type || 1,
        grid: gridStrings,
        words: words,
        sentence: levelData.sentence || "",
        bonus: levelData.bonus || "",
        id: levelId
      };
      
      console.log('最终导出配置:', exportConfig);
      return exportConfig;
      
    } catch (error) {
      console.error('准备关卡导出数据时出错:', error, levelData);
      throw new Error(`关卡 "${levelData.title || 'Unknown'}" 数据格式无效`);
    }
  }

  // 导入配置
  importConfig() {
    if (window.electronAPI && window.electronAPI.openFileDialog) {
      window.electronAPI.openFileDialog()
        .then(result => {
          console.log('文件对话框结果:', result);
          
          if (result && result.success && result.filePath) {
            this.processConfigFile(result.filePath);
          } else if (result && result.canceled) {
            console.log('用户取消了文件选择');
          } else {
            console.error('文件选择失败:', result);
            alert('文件选择失败');
          }
        })
        .catch(error => {
          console.error('选择文件失败:', error);
          alert('选择文件失败: ' + error.message);
        });
    } else {
      // 非Electron环境的备用方案
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.processConfigFileFromFile(file);
        }
      };
      input.click();
    }
  }

  // 处理配置文件
  async processConfigFile(filePath) {
    try {
      console.log('开始处理配置文件:', filePath);
      const fileResult = await window.electronAPI.readFile(filePath);
      
      console.log('文件读取结果:', fileResult);
      
      // 检查文件读取是否成功
      if (!fileResult || !fileResult.success) {
        const errorMsg = fileResult?.message || '文件读取失败';
        console.error('文件读取失败:', errorMsg);
        alert('文件读取失败: ' + errorMsg);
        return;
      }
      
      // 提取文件内容
      const fileContent = fileResult.content;
      console.log('文件内容类型:', typeof fileContent);
      console.log('文件内容长度:', fileContent.length);
      
      let levels = [];
      if (typeof fileContent === 'string') {
        try {
          levels = JSON.parse(fileContent);
          console.log('JSON解析成功');
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          alert('配置文件格式错误，不是有效的JSON文件');
          return;
        }
      } else {
        levels = fileContent;
        console.log('文件内容已经是对象类型');
      }

      if (!Array.isArray(levels)) {
        levels = [levels]; // 如果是单个关卡，转换为数组
        console.log('转换为数组格式');
      }

      console.log(`配置文件包含 ${levels.length} 个关卡`);
      console.log('第一个关卡数据结构:', levels[0]);
      
      // 验证所有关卡
      const validLevels = [];
      const invalidLevels = [];
      
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        if (this.validateImportedLevelConfig(level)) {
          validLevels.push(level);
        } else {
          invalidLevels.push({
            index: i + 1,
            level: level,
            error: '关卡数据格式无效'
          });
        }
      }

      if (validLevels.length === 0) {
        alert('没有找到有效的关卡数据');
        return;
      }

      // 显示导入结果和关卡列表
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '未知文件';
      this.showImportedLevelsList(validLevels, invalidLevels, fileName);

    } catch (error) {
      console.error('处理配置文件失败:', error);
      alert('处理配置文件失败: ' + error.message);
    }
  }

  // 处理从文件对象读取的配置
  async processConfigFileFromFile(file) {
    try {
      console.log('处理文件对象:', file.name, file.size);
      
      const content = await this.readFileAsText(file);
      console.log('文件内容类型:', typeof content);
      console.log('文件内容长度:', content.length);
      
      let levels;
      try {
        levels = JSON.parse(content);
        console.log('JSON解析成功');
      } catch (parseError) {
        console.error('JSON解析失败:', parseError);
        alert('配置文件格式错误，不是有效的JSON文件');
        return;
      }
      
      if (!Array.isArray(levels)) {
        levels = [levels];
        console.log('转换为数组格式');
      }

      console.log(`配置文件包含 ${levels.length} 个关卡`);
      console.log('第一个关卡数据结构:', levels[0]);
      
      // 验证所有关卡
      const validLevels = [];
      const invalidLevels = [];
      
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        if (this.validateImportedLevelConfig(level)) {
          validLevels.push(level);
        } else {
          invalidLevels.push({
            index: i + 1,
            level: level,
            error: '关卡数据格式无效'
          });
        }
      }

      if (validLevels.length === 0) {
        alert('没有找到有效的关卡数据');
        return;
      }

      // 显示导入结果和关卡列表
      this.showImportedLevelsList(validLevels, invalidLevels, file.name);

    } catch (error) {
      console.error('处理配置文件失败:', error);
      alert('处理配置文件失败: ' + error.message);
    }
  }

  // 读取文件为文本
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  // 显示导入的关卡列表
  showImportedLevelsList(validLevels, invalidLevels, sourceName) {
    console.log('显示导入关卡列表，关卡数量:', validLevels.length);
    
    // 创建弹窗HTML
    const modalHTML = this.createImportModalHTML(validLevels, invalidLevels, sourceName);
    
    // 显示弹窗
    this.showImportModal(modalHTML);
    
    // 绑定弹窗事件
    setTimeout(() => {
      console.log('弹窗DOM更新完成，开始绑定事件...');
      this.bindImportModalEvents(validLevels);
    }, 50);
  }

  // 创建导入弹窗的HTML
  createImportModalHTML(validLevels, invalidLevels, sourceName) {
    const fileName = sourceName.split('/').pop() || sourceName.split('\\').pop() || sourceName;
    
    let html = `
      <div class="import-modal-overlay">
        <div class="import-modal">
          <div class="import-modal-header">
            <h3>导入完成</h3>
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
          </div>
          
          <div class="import-modal-content">
            <div class="import-summary">
              <p><strong>文件:</strong> ${fileName}</p>
              <p><strong>成功导入:</strong> <span class="success-count">${validLevels.length}</span> 个关卡</p>
              ${invalidLevels.length > 0 ? `<p><strong>失败:</strong> <span class="error-count">${invalidLevels.length}</span> 个关卡</p>` : ''}
            </div>
            
            ${validLevels.length > 1 ? `
              <div class="levels-preview">
                <h4>关卡列表</h4>
                <div class="levels-list">
                  ${validLevels.map((level, index) => {
                    const levelNumber = level.level || `关卡${index + 1}`;
                    const title = level.title || '无标题';
                    const wordCount = level.words ? level.words.length : 0;
                    return `
                      <div class="level-item" data-level-index="${index}">
                        <div class="level-info">
                          <span class="level-number">${levelNumber}</span>
                          <span class="level-title">${title}</span>
                          <span class="level-words">${wordCount} 个单词</span>
                        </div>
                        <button class="btn-edit-level" data-level-index="${index}">编辑</button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="import-actions">
              ${validLevels.length === 1 ? `
                <button class="btn-primary" id="edit-levels-btn">编辑关卡</button>
              ` : `
                <button class="btn-secondary" id="edit-first-btn">编辑第一个关卡</button>
              `}
              <button class="btn-secondary" id="save-all-btn">保存所有关卡</button>
              <button class="btn-secondary" id="close-modal-btn">关闭</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  // 显示导入弹窗
  showImportModal(modalHTML) {
    // 移除可能存在的旧弹窗
    const existingModal = document.querySelector('.import-modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 添加弹窗到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 显示弹窗
    const modal = document.querySelector('.import-modal-overlay');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  // 隐藏导入弹窗
  hideImportModal() {
    const modal = document.querySelector('.import-modal-overlay');
    if (modal) {
      modal.remove();
    }
  }
  
  // 在编辑器页面添加导入关卡列表
  addImportedLevelsListToEditor() {
    if (!window.importedLevels || window.importedLevels.length <= 1) {
      return; // 只有一个关卡或没有关卡时不需要显示列表
    }
    
    console.log('在编辑器页面添加导入关卡列表...');
    
    // 查找编辑器页面的合适位置
    const editorPage = document.getElementById('editor-page');
    if (!editorPage) {
      console.error('找不到编辑器页面');
      return;
    }
    
    // 查找或创建导入关卡列表容器
    let importedLevelsContainer = document.getElementById('imported-levels-editor-list');
    if (!importedLevelsContainer) {
      importedLevelsContainer = document.createElement('div');
      importedLevelsContainer.id = 'imported-levels-editor-list';
      importedLevelsContainer.className = 'imported-levels-editor-list collapsed'; // 默认为折叠状态
      
      // 插入到编辑器页面，作为浮动面板
      editorPage.appendChild(importedLevelsContainer);
    }
    
    // 创建导入关卡列表HTML（默认折叠状态）
    const listHTML = this.createEditorImportedLevelsListHTML(false);
    importedLevelsContainer.innerHTML = listHTML;
    
    // 绑定列表事件
    this.bindEditorImportedLevelsListEvents();
    
    console.log('导入关卡列表已添加到编辑器页面');
  }
  
  // 创建编辑器页面的导入关卡列表HTML
  createEditorImportedLevelsListHTML(isExpanded = false) {
    if (!window.importedLevels) return '';
    
    const currentIndex = window.currentEditingImportedLevel?.index || 0;
    const contentDisplay = isExpanded ? 'block' : 'none';
    const toggleText = isExpanded ? '−' : '+';
    
    let html = `
      <div class="imported-levels-editor-panel">
        <div class="panel-header" id="panel-header">
          <h4>关卡列表</h4>
          <button class="panel-toggle-btn" id="panel-toggle-btn">${toggleText}</button>
        </div>
        <div class="panel-content" id="panel-content" style="display: ${contentDisplay};">
          <div class="levels-list-editor">
    `;
    
    window.importedLevels.forEach((level, index) => {
      const levelNumber = level.level || `关卡${index + 1}`;
      const title = level.title || '无标题';
      const wordCount = level.words ? level.words.length : 0;
      const isCurrent = index === currentIndex;
      
      html += `
        <div class="level-item-editor ${isCurrent ? 'current-level' : ''}" data-level-index="${index}">
          <div class="level-info-editor">
            <span class="level-number-editor">${levelNumber}${isCurrent ? ' (当前)' : ''}</span>
            <span class="level-title-editor">${title}</span>
          </div>
          ${!isCurrent ? `<button class="btn-switch-level" data-level-index="${index}">切换</button>` : ''}
        </div>
      `;
    });
    
    html += `
          </div>
          <div class="panel-actions">
            <button class="btn-save-current" id="btn-save-current">保存当前</button>
            <button class="btn-save-all-editor" id="btn-save-all-editor">保存全部</button>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }
  
  // 绑定编辑器页面导入关卡列表的事件
  bindEditorImportedLevelsListEvents() {
    const self = this;
    
    // 绑定面板切换功能
    const toggleContent = () => {
      const content = document.getElementById('panel-content');
      const toggleBtn = document.getElementById('panel-toggle-btn');
      const panel = document.querySelector('.imported-levels-editor-list');
      
      if (content && toggleBtn && panel) {
        const isVisible = content.style.display !== 'none';
        
        if (isVisible) {
          // 折叠：隐藏内容，缩小面板
          content.style.display = 'none';
          toggleBtn.textContent = '+';
          panel.classList.add('collapsed');
          panel.classList.remove('expanded');
        } else {
          // 展开：显示内容，放大面板
          content.style.display = 'block';
          toggleBtn.textContent = '−';
          panel.classList.add('expanded');
          panel.classList.remove('collapsed');
        }
      }
    };
    
    // 绑定面板切换按钮
    const toggleBtn = document.getElementById('panel-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止冒泡
        toggleContent();
      });
    }
    
    // 绑定面板头部点击事件
    const panelHeader = document.getElementById('panel-header');
    if (panelHeader) {
      panelHeader.addEventListener('click', toggleContent);
    }
    
    // 绑定关卡切换按钮
    const switchBtns = document.querySelectorAll('.btn-switch-level');
    switchBtns.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const levelIndex = parseInt(btn.getAttribute('data-level-index'));
        console.log(`切换到关卡 ${levelIndex}`);
        
        // 切换到指定关卡
        self.switchToImportedLevel(levelIndex);
      });
    });
    
    // 绑定保存当前关卡按钮
    const saveCurrentBtn = document.getElementById('btn-save-current');
    if (saveCurrentBtn) {
      saveCurrentBtn.addEventListener('click', () => {
        console.log('保存当前关卡');
        // 这里可以调用现有的保存逻辑
        if (window.saveCurrentLevel) {
          window.saveCurrentLevel();
        }
      });
    }
    
    // 绑定保存所有关卡按钮
    const saveAllBtn = document.getElementById('btn-save-all-editor');
    if (saveAllBtn) {
      saveAllBtn.addEventListener('click', () => {
        console.log('保存所有关卡');
        self.saveAllImportedLevels();
      });
    }
  }
  
  // 切换到指定的导入关卡
  switchToImportedLevel(levelIndex) {
    console.log(`切换到导入关卡 ${levelIndex}`);
    
    if (!window.importedLevels || !window.importedLevels[levelIndex]) {
      console.error('关卡数据不存在');
      return;
    }
    
    // 转换关卡数据
    const level = window.importedLevels[levelIndex];
    const editorLevelData = this.convertToEditorFormat(level);
    
    // 为导入的关卡创建虚拟文件路径
    const virtualFilePath = `imported_level_${levelIndex}_${level.level || 'unknown'}.json`;
    editorLevelData._filePath = virtualFilePath;
    
    // 加载关卡到编辑器
    if (window.loadLevelIntoEditor) {
      try {
        window.loadLevelIntoEditor(editorLevelData);
        console.log(`成功切换到关卡 ${levelIndex}`);
        
        // 设置当前关卡文件路径为虚拟路径
        window.currentLevelFilePath = virtualFilePath;
        console.log('切换关卡时设置虚拟文件路径:', window.currentLevelFilePath);
        
        // 更新当前编辑的关卡索引
        window.currentEditingImportedLevel = {
          index: levelIndex,
          originalData: level,
          editorData: editorLevelData
        };
        
        // 刷新关卡列表显示
        this.refreshEditorImportedLevelsList();
        
      } catch (error) {
        console.error('切换关卡时出错:', error);
        alert('切换关卡失败: ' + error.message);
      }
    } else {
      console.error('loadLevelIntoEditor 方法不可用');
      alert('切换关卡失败');
    }
  }
  
  // 刷新编辑器页面的导入关卡列表
  refreshEditorImportedLevelsList() {
    const container = document.getElementById('imported-levels-editor-list');
    if (container) {
      // 保存当前的展开/折叠状态
      const wasExpanded = container.classList.contains('expanded');
      const wasCollapsed = container.classList.contains('collapsed');
      
      // 重新生成HTML，传入当前状态
      const listHTML = this.createEditorImportedLevelsListHTML(wasExpanded);
      container.innerHTML = listHTML;
      
      // 恢复之前的状态类
      if (wasExpanded) {
        container.classList.add('expanded');
        container.classList.remove('collapsed');
      } else {
        container.classList.add('collapsed');
        container.classList.remove('expanded');
      }
      
      // 重新绑定事件
      this.bindEditorImportedLevelsListEvents();
    }
  }
  
  // 绑定导入弹窗的事件
  bindImportModalEvents(validLevels) {
    // 存储导入的关卡数据，供后续使用
    window.importedLevels = validLevels;
    
    // 保存 this 引用，避免在 setTimeout 中丢失上下文
    const self = this;
    
    setTimeout(() => {
      console.log('开始绑定弹窗事件...');
      
      // 绑定关闭按钮
      const closeBtn = document.getElementById('modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          self.hideImportModal();
        });
      }
      
      // 绑定编辑关卡按钮（单个关卡时）
      const editLevelsBtn = document.getElementById('edit-levels-btn');
      if (editLevelsBtn) {
        editLevelsBtn.addEventListener('click', () => {
          console.log('编辑关卡按钮被点击');
          self.hideImportModal();
          // 直接编辑第一个关卡
          if (validLevels.length > 0) {
            self.editImportedLevel(0);
          }
        });
      }
      
      // 绑定编辑第一个关卡按钮（多个关卡时）
      const editFirstBtn = document.getElementById('edit-first-btn');
      if (editFirstBtn) {
        editFirstBtn.addEventListener('click', () => {
          console.log('编辑第一个关卡按钮被点击');
          self.hideImportModal();
          // 直接编辑第一个关卡
          if (validLevels.length > 0) {
            self.editImportedLevel(0);
          }
        });
      }
      
      // 绑定各个关卡的编辑按钮
      const editLevelBtns = document.querySelectorAll('.btn-edit-level');
      editLevelBtns.forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const levelIndex = parseInt(btn.getAttribute('data-level-index'));
          console.log(`编辑关卡 ${levelIndex} 按钮被点击`);
          
          self.hideImportModal();
          self.editImportedLevel(levelIndex);
        });
      });
      
      // 绑定保存所有关卡按钮
      const saveAllBtn = document.getElementById('save-all-btn');
      if (saveAllBtn) {
        saveAllBtn.addEventListener('click', () => {
          console.log('保存所有关卡按钮被点击');
          self.hideImportModal();
          self.saveAllImportedLevels();
        });
      }
      
      // 绑定关闭弹窗按钮
      const closeModalBtn = document.getElementById('close-modal-btn');
      if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
          self.hideImportModal();
        });
      }
      
      // 点击弹窗外部关闭弹窗
      const modalOverlay = document.querySelector('.import-modal-overlay');
      if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
          if (event.target === modalOverlay) {
            self.hideImportModal();
          }
        });
      }
      
      console.log('弹窗事件绑定完成');
    }, 100);
  }

  // 编辑导入的关卡
  editImportedLevel(levelIndex) {
    console.log('=== editImportedLevel 开始执行 ===');
    console.log('关卡索引:', levelIndex);
    console.log('window.importedLevels:', window.importedLevels);
    
    const level = window.importedLevels[levelIndex];
    if (!level) {
      console.error('关卡数据不存在，levelIndex:', levelIndex);
      alert('关卡数据不存在');
      return;
    }

    console.log('找到关卡数据:', level);

    // 将关卡数据转换为编辑器格式
    console.log('开始转换关卡数据...');
    const editorLevelData = this.convertToEditorFormat(level);
    console.log('转换后的编辑器数据:', editorLevelData);
    
    // 为导入的关卡创建一个虚拟文件路径，用于区分不同的导入关卡
    const virtualFilePath = `imported_level_${levelIndex}_${level.level || 'unknown'}.json`;
    editorLevelData._filePath = virtualFilePath;
    
    // 记录来源页面是批量导入
    this.sourcePageId = 'importedLevels';
    
    // 导航到编辑器页面
    console.log('准备导航到编辑器页面...');
    if (window.navigation && window.navigation.navigateTo) {
      console.log('调用 navigateTo 方法...');
      try {
        window.navigation.navigateTo('editor');
        console.log('导航成功');
      } catch (error) {
        console.error('导航时出错:', error);
        alert('导航失败: ' + error.message);
        return;
      }
    } else {
      console.error('window.navigation.navigateTo 方法不可用');
      alert('导航失败');
      return;
    }
    
    // 保存self引用
    const self = this;
    
    // 等待页面加载完成后加载关卡数据
    console.log('设置延迟加载关卡数据...');
    setTimeout(() => {
      console.log('=== 延迟回调开始执行 ===');
      
      if (window.loadLevelIntoEditor) {
        console.log('调用 loadLevelIntoEditor 方法...');
        try {
          window.loadLevelIntoEditor(editorLevelData);
          console.log('关卡数据加载成功');
          
          // 设置当前关卡文件路径为虚拟路径，避免加载失败提示
          window.currentLevelFilePath = virtualFilePath;
          console.log('设置虚拟文件路径:', window.currentLevelFilePath);
          
          // 在编辑器页面添加导入关卡列表
          self.addImportedLevelsListToEditor();
          
          // 激活导入关卡的导航功能
          if (window.levelNavigationManager) {
            // 隐藏标准的关卡导航，因为我们使用自定义的导入关卡导航
            window.levelNavigationManager.hideNavigationControls();
          }
          
        } catch (error) {
          console.error('加载关卡数据时出错:', error);
          alert('加载关卡数据失败: ' + error.message);
        }
      } else {
        console.error('loadLevelIntoEditor 方法不可用');
        alert('编辑器加载失败');
      }
    }, 500);
    
    // 标记为导入的关卡
    window.currentEditingImportedLevel = {
      index: levelIndex,
      originalData: level,
      editorData: editorLevelData
    };
    
    console.log('=== editImportedLevel 执行完成 ===');
  }

  // 预览导入的关卡
  previewImportedLevel(levelIndex) {
    const level = window.importedLevels[levelIndex];
    if (!level) {
      alert('关卡数据不存在');
      return;
    }

    // 将关卡数据转换为编辑器格式
    const editorLevelData = this.convertToEditorFormat(level);
    
    // 显示预览
    this.showLevelPreview(editorLevelData);
  }

  // 转换关卡数据为编辑器格式
  convertToEditorFormat(levelData) {
    console.log('开始转换关卡数据:', levelData);
    
    // 转换单词数据为已放置单词格式
    const placedWords = this.convertWordsToPlacedWords(levelData.words);
    console.log('转换后的已放置单词:', placedWords);
    
    // 构建编辑器期望的数据格式
    const editorData = {
      level: levelData.level || 1,
      title: levelData.title || '无标题',
      type: levelData.type || 1,
      grid: {
        letters: levelData.grid, // 网格字母数据
        placedWords: placedWords, // 已放置的单词
        bonusWords: levelData.bonus ? levelData.bonus.split(',').filter(w => w.trim()) : []
      },
      words: levelData.words, // 保持原始单词格式用于兼容性
      sentence: levelData.sentence || '',
      bonus: levelData.bonus || '',
      metadata: {
        importedAt: new Date().toISOString(),
        importSource: 'config_import'
      }
    };
    
    console.log('转换完成的编辑器数据:', editorData);
    return editorData;
  }

  // 扁平化网格数组（兼容旧版浏览器）
  flattenGrid(grid) {
    if (!Array.isArray(grid)) return '';
    let result = '';
    for (let i = 0; i < grid.length; i++) {
      if (Array.isArray(grid[i])) {
        for (let j = 0; j < grid[i].length; j++) {
          result += grid[i][j] || '';
        }
      } else if (typeof grid[i] === 'string') {
        result += grid[i];
      }
    }
    return result;
  }

  // 转换单词数据为已放置单词格式
  convertWordsToPlacedWords(words) {
    if (!words || !Array.isArray(words)) {
      console.error('无效的单词数据:', words);
      return [];
    }
    
    console.log('开始转换单词数据:', words);
    
    return words.map((word, index) => {
      if (!word.word) {
        console.warn(`跳过无效单词数据 (索引 ${index}):`, word);
        return null;
      }
      
      // 解析位置信息
      const positions = this.parsePositions(word.pos);
      if (positions.length === 0) {
        console.warn(`单词 "${word.word}" 没有有效位置信息:`, word.pos);
        return null;
      }
      
      // 判断是否为特殊单词
      const isGold = word.coins && word.coins.includes('0,5');
      const isBlackDot = word.point && word.point.includes('0,4');
      
      const placedWord = {
        word: word.word,
        positions: positions,
        isGold: isGold,
        isBlackDot: isBlackDot,
        id: index, // 添加唯一ID
        direction: this.determineDirection(positions), // 自动判断方向
        color: null // 颜色将在网格中自动分配
      };
      
      console.log(`转换单词 "${word.word}":`, placedWord);
      return placedWord;
    }).filter(Boolean); // 过滤掉 null 值
  }

  // 解析位置字符串
  parsePositions(posStr) {
    if (!posStr) return [];
    return posStr.split(';').map(pos => {
      const [row, col] = pos.split(',').map(Number);
      return { row, col };
    });
  }
  
  // 自动判断单词方向
  determineDirection(positions) {
    if (!positions || positions.length < 2) return 'horizontal';
    
    const first = positions[0];
    const last = positions[positions.length - 1];
    
    // 计算方向
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    if (deltaRow === 0) {
      return deltaCol > 0 ? 'horizontal' : 'horizontal-reverse';
    } else if (deltaCol === 0) {
      return deltaRow > 0 ? 'vertical' : 'vertical-reverse';
    } else if (deltaRow === deltaCol) {
      return deltaRow > 0 ? 'diagonal-down' : 'diagonal-up';
    } else if (deltaRow === -deltaCol) {
      return deltaRow > 0 ? 'diagonal-up-reverse' : 'diagonal-down-reverse';
    }
    
    return 'horizontal'; // 默认方向
  }

  // 保存所有导入的关卡
  async saveAllImportedLevels() {
    if (!window.importedLevels || window.importedLevels.length === 0) {
      alert('没有可保存的关卡');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < window.importedLevels.length; i++) {
      try {
        const level = window.importedLevels[i];
        const editorData = this.convertToEditorFormat(level);
        
        // 生成唯一文件名
        const filename = `level_${this.generateUniqueId()}.json`;
        
        // 保存关卡
        await window.electronAPI.saveLevel(filename, editorData);
        successCount++;
        
        // 添加延迟避免过快保存
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`保存关卡 ${i + 1} 失败:`, error);
        errorCount++;
      }
    }

    // 显示保存结果
    this.showSaveResults(successCount, errorCount);
    
    // 刷新关卡列表
    if (successCount > 0) {
      setTimeout(() => {
        this.refreshLevelList();
      }, 1000);
    }
  }

  // 显示保存结果
  showSaveResults(successCount, errorCount) {
    const message = `保存完成！\n成功: ${successCount} 个关卡\n${errorCount > 0 ? `失败: ${errorCount} 个关卡` : ''}`;
    alert(message);
  }

  // 生成唯一ID
  generateUniqueId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // 显示页面
  showPage(pageId, htmlContent) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    
    // 创建或显示目标页面
    let targetPage = document.getElementById(pageId);
    if (!targetPage) {
      targetPage = document.createElement('div');
      targetPage.id = pageId;
      targetPage.className = 'page';
      document.body.appendChild(targetPage);
    }
    
    targetPage.innerHTML = htmlContent;
    targetPage.style.display = 'block';
    
    // 更新当前页面
    this.currentPage = pageId;
    
    // 隐藏关卡导航控件（如果存在）
    if (window.levelNavigationManager) {
      window.levelNavigationManager.hideNavigationControls();
    }
  }

  // 显示关卡预览
  showLevelPreview(levelData) {
    // 创建预览HTML
    const previewHTML = this.createLevelPreviewHTML(levelData);
    this.showPage('levelPreview', previewHTML);
    
    // 绑定预览页面的事件
    setTimeout(() => {
      const editBtn = document.getElementById('preview-edit-btn');
      const backBtn = document.getElementById('preview-back-btn');
      
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          if (window.currentEditingImportedLevel) {
            this.editImportedLevel(window.currentEditingImportedLevel.index);
          }
        });
      }
      
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.showImportedLevelsList(window.importedLevels, [], '');
        });
      }
    }, 100);
  }

  // 创建关卡预览HTML
  createLevelPreviewHTML(levelData) {
    const title = levelData.title || '关卡预览';
    const levelNumber = levelData.level || '未知';
    const gridSize = levelData.grid ? `${levelData.grid.length}x${levelData.grid[0]?.length || 0}` : '未知';
    const wordCount = levelData.words ? levelData.words.length : 0;
    
    return `
      <div class="level-preview-container">
        <div class="preview-header">
          <h2>${title}</h2>
          <p>关卡 ${levelNumber} | 网格: ${gridSize} | 单词: ${wordCount}</p>
        </div>
        
        <div class="preview-grid">
          ${this.createPreviewGridHTML(levelData.grid)}
        </div>
        
        <div class="preview-words">
          <h3>单词列表</h3>
          <div class="words-list">
            ${this.createPreviewWordsHTML(levelData.words)}
          </div>
        </div>
        
                 <div class="preview-actions">
           <button class="btn-edit" id="preview-edit-btn">编辑关卡</button>
           <button class="btn-back" id="preview-back-btn">返回列表</button>
         </div>
      </div>
    `;
  }

  // 创建预览网格HTML
  createPreviewGridHTML(grid) {
    if (!grid || !Array.isArray(grid)) return '<p>网格数据无效</p>';
    
    let html = '<div class="preview-grid">';
    grid.forEach((row, rowIndex) => {
      html += '<div class="preview-row">';
      row.split('').forEach((letter, colIndex) => {
        html += `<div class="preview-cell">${letter}</div>`;
      });
      html += '</div>';
    });
    html += '</div>';
    
    return html;
  }

  // 创建预览单词HTML
  createPreviewWordsHTML(words) {
    if (!words || !Array.isArray(words)) return '<p>单词数据无效</p>';
    
    let html = '<div class="words-grid">';
    words.forEach(word => {
      const isGold = word.coins && word.coins.includes('0,5');
      const isBlackDot = word.point && word.point.includes('0,4');
      let wordClass = 'word-item';
      if (isGold) wordClass += ' gold-word';
      if (isBlackDot) wordClass += ' black-dot-word';
      
      html += `
        <div class="${wordClass}">
          <span class="word-text">${word.word}</span>
          ${isGold ? '<span class="gold-icon">🌟</span>' : ''}
          ${isBlackDot ? '<span class="black-dot-icon">⚫</span>' : ''}
        </div>
      `;
    });
    html += '</div>';
    
    return html;
  }

  // 刷新关卡列表
  refreshLevelList() {
    if (this.currentPage === 'levelList') {
      this.loadLevelList();
    }
  }
} 