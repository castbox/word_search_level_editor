class WordList {
  constructor(grid) {
    this.words = []; // 存储单词
    this.grid = grid; // 引用网格对象以便与之交互
    this.wordListElement = document.getElementById('word-list');
    this.newWordInput = document.getElementById('new-word');
    this.addWordButton = document.getElementById('add-word');
    
    // 词频分析器实例
    this.wordFrequency = null;
    
    // 拖拽相关变量
    this.draggedWord = null;
    this.dragDirection = 'horizontal'; // 默认水平方向
    this.previewCells = [];
    
    // 将实例存储在全局变量中，使网格可以访问
    window.wordListInstance = this;
    
    // 绑定事件处理程序
    this.addWordButton.addEventListener('click', () => this.addWord());
    this.newWordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addWord();
    });
    
    // 添加输入框自动转大写功能
    this.newWordInput.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    });
    
    // 初始化拖放事件处理
    this.initDragAndDrop();
    
    // 更新并监听网格变化
    this.setupGridChangeListener();
    
    // 初始化词频分析器
    this.initWordFrequency();
    
    // 初始化词频详情模态框
    this.initWordFrequencyModal();
  }
  
  // 初始化词频分析器
  initWordFrequency() {
    // 等待全局WordFrequency实例可用
    if (window.wordFrequencyInstance) {
      this.wordFrequency = window.wordFrequencyInstance;
      console.log('WordList: 词频分析器已初始化');
      this.setupLevelChangeListener();
    } else if (window.WordFrequency) {
      this.wordFrequency = new window.WordFrequency();
      console.log('WordList: 词频分析器已初始化');
      this.setupLevelChangeListener();
    } else {
      // 如果还没有加载，稍后再试
      setTimeout(() => {
        this.initWordFrequency();
      }, 1000);
    }
  }
  
  // 设置关卡等级变化监听器
  setupLevelChangeListener() {
    if (this.levelChangeListenerAdded) return; // 防止重复添加
    
    // 监听关卡等级变化事件
    window.addEventListener('levelNumberChanged', (event) => {
      console.log(`WordList: 接收到关卡等级变化事件: ${event.detail.levelNumber}`);
      // 刷新单词列表的词频显示
      this.refreshFrequencyDisplay();
    });
    
    this.levelChangeListenerAdded = true;
    console.log('WordList: 关卡等级变化监听器已设置');
  }
  
  // 刷新词频显示
  refreshFrequencyDisplay() {
    if (!this.wordFrequency || !this.wordFrequency.levelAnalysis.isAnalysisReady) {
      console.log('WordList: 词频分析器未准备好，跳过刷新');
      return;
    }
    
    console.log('WordList: 开始刷新词频显示');
    // 重新渲染单词列表以更新词频指示器
    this.renderWordList();
  }
  
  // 初始化词频详情模态框
  initWordFrequencyModal() {
    // 创建模态框HTML
    const modalHTML = `
      <div id="word-frequency-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>单词词频详情</h3>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <div class="word-frequency-info">
              <div class="word-title">
                <span class="word-text"></span>
                <span class="word-badges"></span>
              </div>
              
              <div class="frequency-sections">
                <!-- BNC-COCA 词频信息 -->
                <div class="frequency-section">
                  <h4>📊 BNC-COCA 词频</h4>
                  <div class="bnc-frequency-info">
                    <div class="frequency-item">
                      <label>词频等级:</label>
                      <span class="frequency-level"></span>
                    </div>
                    <div class="frequency-item">
                      <label>词频排名:</label>
                      <span class="frequency-rank"></span>
                    </div>
                  </div>
                </div>
                
                <!-- 关卡使用统计 -->
                <div class="frequency-section">
                  <h4>🎯 关卡使用统计</h4>
                  <div class="level-stats-info">
                    <div class="stats-grid">
                      <div class="stat-item">
                        <span class="stat-number total-count">0</span>
                        <span class="stat-label">总使用次数</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-number recent5-count">0</span>
                        <span class="stat-label">近5关使用</span>
                      </div>
                    </div>
                    <div class="usage-status">
                      <span class="new-word-badge">✨ 首次使用</span>
                    </div>
                  </div>
                </div>
                
                <!-- 使用历史 -->
                <div class="frequency-section">
                  <h4>📝 使用历史</h4>
                  <div class="usage-history">
                    <div class="history-tabs">
                      <button class="history-tab active" data-tab="recent">近期使用</button>
                      <button class="history-tab" data-tab="all">全部历史</button>
                    </div>
                    <div class="history-content">
                      <div class="history-list recent-history active">
                        <!-- 近期使用历史 -->
                      </div>
                      <div class="history-list all-history">
                        <!-- 全部使用历史 -->
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 绑定关闭事件
    const modal = document.getElementById('word-frequency-modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
    

    
    // 历史标签切换
    const historyTabs = modal.querySelectorAll('.history-tab');
    historyTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.target.dataset.tab;
        this.switchHistoryTab(tabType);
      });
    });
  }
  
  // 切换历史标签
  switchHistoryTab(tabType) {
    const modal = document.getElementById('word-frequency-modal');
    const tabs = modal.querySelectorAll('.history-tab');
    const contents = modal.querySelectorAll('.history-list');
    
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabType);
    });
    
    contents.forEach(content => {
      content.classList.toggle('active', content.classList.contains(`${tabType}-history`));
    });
  }
  
  // 显示单词词频详情
  showWordFrequencyDetail(word) {
    if (!this.wordFrequency || !this.wordFrequency.levelAnalysis.isAnalysisReady) {
      showStatusMessage('词频分析尚未完成，请稍后再试', 'warning');
      return;
    }
    
    const wordInfo = this.wordFrequency.getCompleteWordInfo(word);
    const modal = document.getElementById('word-frequency-modal');
    
    // 更新单词标题
    const wordText = modal.querySelector('.word-text');
    wordText.textContent = word.toUpperCase();
    
    // 更新徽章
    const wordBadges = modal.querySelector('.word-badges');
    wordBadges.innerHTML = '';
    
    if (wordInfo.isNewWord) {
      wordBadges.innerHTML += '<span class="frequency-badge new-word">新单词</span>';
    }
    
    // 添加BNC-COCA频率徽章
    if (wordInfo.bnc.isKnown) {
      const badge = document.createElement('span');
      badge.className = `frequency-badge ${wordInfo.bnc.level}`;
      badge.textContent = wordInfo.bnc.levelName;
      badge.style.backgroundColor = wordInfo.bnc.color;
      wordBadges.appendChild(badge);
    }
    
    // 更新BNC-COCA频率信息
    const frequencyLevel = modal.querySelector('.frequency-level');
    const frequencyRank = modal.querySelector('.frequency-rank');
    
    if (wordInfo.bnc.isKnown) {
      frequencyLevel.textContent = wordInfo.bnc.levelName;
      frequencyLevel.style.color = wordInfo.bnc.color;
      frequencyRank.textContent = `第 ${wordInfo.bnc.rank} 位`;
    } else {
      frequencyLevel.textContent = '未知';
      frequencyLevel.style.color = '#7f8c8d';
      frequencyRank.textContent = '无数据';
    }
    
    // 更新关卡统计
    const totalCountEl = modal.querySelector('.total-count');
    const recent5CountEl = modal.querySelector('.recent5-count');
    const newWordBadge = modal.querySelector('.new-word-badge');
    
    // 清理之前的范围信息
    const existingRangeInfo = modal.querySelector('.level-range-info');
    if (existingRangeInfo) {
      existingRangeInfo.remove();
    }
    
    if (wordInfo.levelStats.isReady) {
      totalCountEl.textContent = wordInfo.levelStats.totalCount;
      recent5CountEl.textContent = wordInfo.levelStats.recent5Count;
      newWordBadge.style.display = wordInfo.levelStats.isFirstTime ? 'block' : 'none';
      
      // 显示统计范围
      const rangeInfo = document.createElement('div');
      rangeInfo.className = 'level-range-info';
      rangeInfo.innerHTML = `<small>统计范围: 关卡 ${wordInfo.levelStats.currentLevelRange}</small>`;
      newWordBadge.parentNode.appendChild(rangeInfo);
    } else {
      totalCountEl.textContent = '?';
      recent5CountEl.textContent = '?';
      newWordBadge.style.display = 'none';
    }
    
    // 更新使用历史
    this.updateUsageHistory(wordInfo.levelStats);
    
    // 显示模态框
    modal.classList.add('active');
  }
  
  // 更新使用历史
  updateUsageHistory(levelStats) {
    const modal = document.getElementById('word-frequency-modal');
    const recentHistory = modal.querySelector('.recent-history');
    const allHistory = modal.querySelector('.all-history');
    
    // 清空历史列表
    recentHistory.innerHTML = '';
    allHistory.innerHTML = '';
    
    if (!levelStats.isReady || levelStats.isFirstTime) {
      recentHistory.innerHTML = '<div class="no-history">暂无使用历史</div>';
      allHistory.innerHTML = '<div class="no-history">暂无使用历史</div>';
      return;
    }
    
    // 创建历史项
    const createHistoryItem = (levelInfo) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const date = new Date(levelInfo.createdAt).toLocaleDateString();
      item.innerHTML = `
        <div class="history-level">
          <span class="level-title">${levelInfo.title}</span>
          <span class="level-number">第${levelInfo.levelNumber}关</span>
        </div>
        <div class="history-date">${date}</div>
      `;
      
      return item;
    };
    
    // 填充近期历史（近5关）
    if (levelStats.recent5Levels.length > 0) {
      levelStats.recent5Levels.forEach(levelInfo => {
        recentHistory.appendChild(createHistoryItem(levelInfo));
      });
    } else {
      recentHistory.innerHTML = '<div class="no-history">近5关无使用记录</div>';
    }
    
    // 填充全部历史
    if (levelStats.levels.length > 0) {
      levelStats.levels.forEach(levelInfo => {
        allHistory.appendChild(createHistoryItem(levelInfo));
      });
    } else {
      allHistory.innerHTML = '<div class="no-history">暂无使用历史</div>';
    }
  }
  
  // 初始化拖放事件
  initDragAndDrop() {
    // 监听网格区域的事件
    const gridElement = this.grid.gridElement;
    
    // 监听整个文档的键盘事件来切换方向
    document.addEventListener('keydown', (e) => {
      if (this.draggedWord && (e.key === 'r' || e.key === 'R')) {
        // 循环切换方向，按照顺时针顺序排列
        const directions = [
          'horizontal',       // → (0°)
          'diagonalUp',       // ↗ (45°)
          'reverseVertical',  // ↑ (90°)
          'reverseDiagonalUp',// ↖ (135°)
          'reverseHorizontal',// ← (180°)
          'reverseDiagonal',  // ↙ (225°)
          'vertical',         // ↓ (270°)
          'diagonal'          // ↘ (315°)
        ];
        const currentIndex = directions.indexOf(this.dragDirection);
        const nextIndex = (currentIndex + 1) % directions.length;
        this.dragDirection = directions[nextIndex];
        
        // 更新方向提示
        this.updateDirectionDisplay();
        
        // 先清除当前预览，再显示新方向的预览
        this.clearWordPreview();
        
        // 更新当前预览
        const hoveredCell = document.querySelector('.grid-cell.hovered');
        if (hoveredCell) {
          const row = parseInt(hoveredCell.dataset.row, 10);
          const col = parseInt(hoveredCell.dataset.col, 10);
          this.showWordPreview(row, col);
          this.showHoverHint(row, col);
        }
      }
    });
    
    // 添加网格单元格鼠标进入事件 - 使用事件委托
    gridElement.addEventListener('mouseover', (e) => {
      if (!this.draggedWord) return;
      
      // 找到实际的grid-cell元素，无论事件是在哪个子元素上触发的
      let cell = e.target;
      while (cell && !cell.classList.contains('grid-cell') && cell !== gridElement) {
        cell = cell.parentElement;
      }
      
      if (cell && cell.classList.contains('grid-cell')) {
        // 标记当前悬停的单元格
        cell.classList.add('hovered');
        
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        
        // 显示单词预览
        this.showWordPreview(row, col);
        
        // 显示悬停提示
        this.showHoverHint(row, col);
      }
    });
    
    // 添加网格单元格鼠标离开事件 - 使用事件委托
    gridElement.addEventListener('mouseout', (e) => {
      if (!this.draggedWord) return;
      
      // 找到实际的grid-cell元素，无论事件是在哪个子元素上触发的
      let cell = e.target;
      while (cell && !cell.classList.contains('grid-cell') && cell !== gridElement) {
        cell = cell.parentElement;
      }
      
      if (cell && cell.classList.contains('grid-cell')) {
        // 移除悬停标记
        cell.classList.remove('hovered');
        
        // 清除预览
        this.clearWordPreview();
        
        // 隐藏快速提示
        this.hideQuickHint();
      }
    });

    // 添加整个网格区域的鼠标离开事件，确保彻底清理
    gridElement.addEventListener('mouseleave', (e) => {
      if (!this.draggedWord) return;
      
      // 清除所有悬停状态
      document.querySelectorAll('.grid-cell.hovered').forEach(cell => {
        cell.classList.remove('hovered');
      });
      
      // 完全清除预览状态
      this.clearWordPreview();
      
      // 隐藏快速提示
      this.hideQuickHint();
    });
    
    // 添加网格单元格点击事件，用于放置单词 - 使用事件委托
    gridElement.addEventListener('click', (e) => {
      if (!this.draggedWord) return;
      
      // 找到实际的grid-cell元素，无论事件是在哪个子元素上触发的  
      let cell = e.target;
      while (cell && !cell.classList.contains('grid-cell') && cell !== gridElement) {
        cell = cell.parentElement;
      }
      
      if (cell && cell.classList.contains('grid-cell')) {
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        
        // 在放置前检查可行性并生成详细错误信息
        const placementResult = this.checkWordPlacement(this.draggedWord, row, col, this.dragDirection);
        
        if (placementResult.canPlace) {
          // 如果有警告，先显示警告信息
          if (placementResult.hasWarning) {
            showStatusMessage(placementResult.warningMessage, 'warning');
            // 延迟一秒后继续放置
            setTimeout(() => {
              this.performWordPlacement(row, col);
            }, 1000);
          } else {
            // 直接放置
            this.performWordPlacement(row, col);
          }
        } else {
          // 显示详细的错误信息
          showStatusMessage(placementResult.errorMessage, 'error');
        }
      }
    });
  }
  
  // 显示单词预览
  showWordPreview(startRow, startCol) {
    // 清除之前的预览
    this.clearWordPreview();
    
    if (!this.draggedWord) return;
    
    const word = this.draggedWord.toUpperCase();
    const directions = {
      horizontal: { rowChange: 0, colChange: 1 },
      vertical: { rowChange: 1, colChange: 0 },
      diagonal: { rowChange: 1, colChange: 1 },
      reverseDiagonal: { rowChange: 1, colChange: -1 },
      reverseHorizontal: { rowChange: 0, colChange: -1 },
      reverseVertical: { rowChange: -1, colChange: 0 },
      diagonalUp: { rowChange: -1, colChange: 1 }, // 左下到右上 ↗
      reverseDiagonalUp: { rowChange: -1, colChange: -1 } // 右下到左上 ↖
    };
    
    const { rowChange, colChange } = directions[this.dragDirection];
    let canPlace = true;
    let hasConflicts = false;
    let outOfBounds = false;
    
    // 获取或创建单词的颜色
    const color = this.grid.assignColorToWord(word);
    
    // 检查单词放置的可行性
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      
      // 检查边界
      if (row < 0 || row >= this.grid.height || col < 0 || col >= this.grid.width) {
        outOfBounds = true;
        canPlace = false;
        continue; // 继续检查其他位置，但标记为无法放置
      }
      
      // 检查是否有字母冲突
      const currentLetter = this.grid.letters[row][col];
      if (currentLetter && currentLetter !== word[i]) {
        hasConflicts = true;
        canPlace = false;
        
        // 检查是否是拖拽单词冲突（更严重的冲突）
        for (const placedWord of this.grid.placedWords) {
          if (placedWord.isDragged && placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
            // 这是与拖拽单词的冲突，更严重
            break;
          }
        }
      }
    }
    
    // 显示单词预览 - 无论是否可以放置都显示
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      
      // 即使超出边界也继续处理，让用户看到完整的单词预览意图
      let cell = null;
      let isOutOfBounds = false;
      
      if (row < 0 || row >= this.grid.height || col < 0 || col >= this.grid.width) {
        isOutOfBounds = true;
        // 对于超出边界的字母，我们仍然可以在状态消息中显示
      } else {
        // 获取单元格
        cell = this.grid.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      }
      
      if (cell) {
        // 检查是否已有其他单词的字母
        const currentLetter = this.grid.letters[row][col];
        
        // 判断冲突类型
        const isIntersection = currentLetter && currentLetter === word[i];
        const willOverwrite = currentLetter && currentLetter !== word[i];
        let isDraggedWordConflict = false;
        
        // 检查是否与拖拽单词冲突
        if (willOverwrite) {
          for (const placedWord of this.grid.placedWords) {
            if (placedWord.isDragged && placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
              isDraggedWordConflict = true;
              break;
            }
          }
        }
        
        // 使用不同的预览样式来指示不同情况
        if (isDraggedWordConflict) {
          // 与拖拽单词冲突，使用最严重的错误样式
          cell.classList.add('preview-blocked');
        } else if (willOverwrite) {
          // 字母不匹配但可以覆盖，使用警告样式
          cell.classList.add('preview-overwrite');
        } else if (isIntersection) {
          // 交叉点(相同字母)，显示成功样式
          cell.classList.add('preview-intersection');
        } else {
          // 普通放置，使用正常样式
          cell.classList.add('preview');
        }
        
        // 应用单词颜色到预览
        if (isDraggedWordConflict) {
          // 严重冲突：红色背景
          cell.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
        } else if (willOverwrite) {
          // 可覆盖冲突：橙色背景
          cell.style.backgroundColor = 'rgba(255, 152, 0, 0.7)';
        } else if (isIntersection) {
          // 交叉点：使用渐变色显示
          for (const { word: placedWord, positions } of this.grid.placedWords) {
            if (positions.some(pos => pos.row === row && pos.col === col)) {
              const existingColor = this.grid.colorMap[placedWord];
              if (existingColor) {
                cell.style.background = `linear-gradient(135deg, ${existingColor} 0%, ${existingColor} 49%, ${color} 51%, ${color} 100%)`;
                break;
              }
            }
          }
        } else {
          // 正常放置：使用单词颜色，但稍微透明以表示预览状态
          cell.style.backgroundColor = color;
          cell.style.opacity = '0.8';
        }
        
        // 设置预览文本
        const previewElement = document.createElement('div');
        previewElement.className = 'preview-text';
        previewElement.textContent = word[i];
        previewElement.style.color = '#000000';
        previewElement.style.fontWeight = 'bold';
        previewElement.style.pointerEvents = 'none';
        
        // 根据不同情况添加样式类
        if (isDraggedWordConflict) {
          previewElement.classList.add('blocked');
          previewElement.style.color = '#ffffff'; // 白色字体在红色背景上更清晰
        } else if (willOverwrite) {
          previewElement.classList.add('will-overwrite');
          previewElement.style.color = '#ffffff'; // 白色字体在橙色背景上更清晰
        } else if (isIntersection) {
          previewElement.classList.add('is-intersection');
          previewElement.style.textShadow = '0px 0px 2px #000';
        }
        
        cell.appendChild(previewElement);
        
        // 记录预览单元格
        this.previewCells.push(cell);
      }
    }
    
    // 根据整体状态添加额外样式
    if (!canPlace) {
      // 如果无法放置，为所有预览单元格添加无效标记
      this.previewCells.forEach(cell => {
        cell.classList.add('preview-invalid');
        // 但不覆盖已有的背景色，保持具体的错误指示
      });
      
      // 显示详细的错误原因
      if (outOfBounds) {
        // 通过状态消息告知超出边界
        // 状态消息将在点击时显示
      } else if (hasConflicts) {
        // 通过状态消息告知冲突详情
        // 状态消息将在点击时显示
      }
    }
  }
  
  // 清除单词预览
  clearWordPreview() {
    // 简单有效的清理：只清理预览状态，然后让redrawPlacedWords处理正确显示
    document.querySelectorAll('.grid-cell').forEach(cell => {
      // 检查是否有任何预览相关的类
      const previewClasses = ['preview', 'preview-invalid', 'preview-overwrite', 'preview-intersection', 'preview-blocked'];
      const hasPreviewClass = previewClasses.some(className => cell.classList.contains(className));
      
      if (hasPreviewClass) {
        // 移除所有预览样式类
        previewClasses.forEach(className => cell.classList.remove(className));
        
        // 清除预览相关的临时样式
        cell.style.opacity = '';
        cell.style.animation = '';
        cell.style.boxShadow = '';
        
        // 重置background属性（不影响backgroundColor）
        cell.style.background = '';
      }
    });
    
    // 移除所有预览文本元素
    document.querySelectorAll('.preview-text').forEach(el => el.remove());
    
    // 清空预览单元格数组
    this.previewCells = [];
    
    // 重新绘制已放置的单词，确保所有样式正确显示（包括交叉点）
    this.grid.redrawPlacedWords();
    
    console.log('已清除单词预览状态，重新绘制已放置单词');
  }

  // 检查单词放置的可行性并返回详细信息
  checkWordPlacement(word, startRow, startCol, direction) {
    if (!word) {
      return { canPlace: false, errorMessage: '没有选择要放置的单词' };
    }

    word = word.toUpperCase();
    const directions = {
      horizontal: { rowChange: 0, colChange: 1, name: '水平' },
      vertical: { rowChange: 1, colChange: 0, name: '垂直' },
      diagonal: { rowChange: 1, colChange: 1, name: '对角线↘' },
      reverseDiagonal: { rowChange: 1, colChange: -1, name: '反对角线↙' },
      reverseHorizontal: { rowChange: 0, colChange: -1, name: '反向水平' },
      reverseVertical: { rowChange: -1, colChange: 0, name: '反向垂直' },
      diagonalUp: { rowChange: -1, colChange: 1, name: '对角线↗' },
      reverseDiagonalUp: { rowChange: -1, colChange: -1, name: '反对角线↖' }
    };

    const directionInfo = directions[direction];
    if (!directionInfo) {
      return { canPlace: false, errorMessage: '无效的放置方向' };
    }

    const { rowChange, colChange, name: directionName } = directionInfo;
    
    // 检查边界
    const outOfBoundsCells = [];
    const conflictCells = [];
    const draggedWordConflicts = [];
    const intersectionCells = [];
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      
      // 检查边界
      if (row < 0 || row >= this.grid.height || col < 0 || col >= this.grid.width) {
        outOfBoundsCells.push({ position: i + 1, letter: word[i], row, col });
        continue;
      }
      
      // 检查字母冲突
      const currentLetter = this.grid.letters[row][col];
      if (currentLetter && currentLetter !== word[i]) {
        // 检查是否与拖拽单词冲突
        let isDraggedWordConflict = false;
        for (const placedWord of this.grid.placedWords) {
          if (placedWord.isDragged && placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
            draggedWordConflicts.push({
              position: i + 1,
              letter: word[i],
              currentLetter,
              row,
              col,
              conflictWord: placedWord.word
            });
            isDraggedWordConflict = true;
            break;
          }
        }
        
        if (!isDraggedWordConflict) {
          conflictCells.push({
            position: i + 1,
            letter: word[i],
            currentLetter,
            row,
            col
          });
        }
      } else if (currentLetter && currentLetter === word[i]) {
        // 记录交叉点
        intersectionCells.push({
          position: i + 1,
          letter: word[i],
          row,
          col
        });
      }
    }
    
    // 生成错误消息
    let errorMessage = '';
    
    if (outOfBoundsCells.length > 0) {
      const outLetters = outOfBoundsCells.map(cell => `第${cell.position}个字母"${cell.letter}"`).join('、');
      errorMessage = `单词"${word}"${directionName}放置时，${outLetters}超出网格边界。请调整起始位置或改变方向。`;
    } else if (draggedWordConflicts.length > 0) {
      const conflicts = draggedWordConflicts.map(cell => 
        `第${cell.position}个字母"${cell.letter}"与已放置单词"${cell.conflictWord}"的字母"${cell.currentLetter}"冲突`
      ).join('、');
      errorMessage = `无法放置单词"${word}"：${conflicts}。拖拽放置的单词无法被覆盖，请选择其他位置或方向。`;
    } else if (conflictCells.length > 0) {
      const conflicts = conflictCells.map(cell => 
        `第${cell.position}个字母"${cell.letter}"与现有字母"${cell.currentLetter}"`
      ).join('、');
      errorMessage = `放置单词"${word}"时发现字母冲突：${conflicts}。现有字母将被覆盖。`;
      
      // 这种情况实际上是可以放置的（会覆盖），所以返回警告而不是错误
      return { 
        canPlace: true, 
        hasWarning: true, 
        warningMessage: errorMessage,
        intersections: intersectionCells.length
      };
    }
    
    // 如果有错误，返回不可放置
    if (errorMessage) {
      return { canPlace: false, errorMessage };
    }
    
    // 成功情况的消息
    let successMessage = `准备${directionName}放置单词"${word}"`;
    if (intersectionCells.length > 0) {
      successMessage += `，将与现有单词形成${intersectionCells.length}个交叉点`;
    }
    
    return { 
      canPlace: true, 
      successMessage, 
      intersections: intersectionCells.length 
    };
  }

  // 显示悬停提示
  showHoverHint(row, col) {
    if (!this.draggedWord) return;

    // 检查放置情况
    const placementResult = this.checkWordPlacement(this.draggedWord, row, col, this.dragDirection);
    
    let hintMessage = '';
    let hintType = 'info';
    
    if (!placementResult.canPlace) {
      // 无法放置，显示错误原因的简化版本
      if (placementResult.errorMessage.includes('超出网格边界')) {
        hintMessage = '❌ 超出边界 - 请调整位置或方向';
      } else if (placementResult.errorMessage.includes('拖拽放置的单词无法被覆盖')) {
        hintMessage = '❌ 与已放置单词冲突 - 无法覆盖';
      } else {
        hintMessage = '❌ 无法放置';
      }
      hintType = 'error';
    } else if (placementResult.hasWarning) {
      hintMessage = '⚠️ 可放置，但会覆盖现有字母';
      hintType = 'warning';
    } else {
      // 可以正常放置
      if (placementResult.intersections > 0) {
        hintMessage = `✅ 可放置，形成${placementResult.intersections}个交叉点`;
      } else {
        hintMessage = '✅ 可正常放置';
      }
      hintType = 'success';
    }
    
    // 显示简短的状态消息
    this.showQuickHint(hintMessage, hintType);
  }

  // 显示快速提示（比普通状态消息更短暂）
  showQuickHint(message, type = 'info') {
    // 创建或获取快速提示元素
    let hintElement = document.getElementById('quick-hint');
    if (!hintElement) {
      hintElement = document.createElement('div');
      hintElement.id = 'quick-hint';
      hintElement.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        max-width: 250px;
        word-wrap: break-word;
      `;
      document.body.appendChild(hintElement);
    }
    
    // 设置消息和样式
    hintElement.textContent = message;
    hintElement.className = `quick-hint ${type}`;
    
    // 根据类型调整颜色
    switch (type) {
      case 'error':
        hintElement.style.background = 'rgba(231, 76, 60, 0.9)';
        break;
      case 'warning':
        hintElement.style.background = 'rgba(255, 152, 0, 0.9)';
        break;
      case 'success':
        hintElement.style.background = 'rgba(46, 125, 50, 0.9)';
        break;
      default:
        hintElement.style.background = 'rgba(0, 0, 0, 0.8)';
    }
    
    // 显示提示
    hintElement.style.opacity = '1';
    
    // 清除之前的定时器
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
    }
    
    // 设置自动隐藏
    this.hintTimer = setTimeout(() => {
      hintElement.style.opacity = '0';
    }, 2000);
  }

  // 隐藏快速提示
  hideQuickHint() {
    const hintElement = document.getElementById('quick-hint');
    if (hintElement) {
      hintElement.style.opacity = '0';
    }
    
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
  }

  // 执行单词放置
  performWordPlacement(row, col) {
    if (!this.draggedWord) return;

    // 尝试放置单词
    const success = this.grid.placeWord(this.draggedWord, row, col, this.dragDirection);
    
    if (success) {
      showStatusMessage(`已成功放置单词: ${this.draggedWord}`, 'success');
      // 移除拖动的单词高亮
      document.querySelectorAll('.word-item.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
      // 清除所有预览
      this.clearWordPreview();
      // 清除拖动状态
      this.draggedWord = null;
      // 隐藏方向显示
      this.hideDirectionDisplay();
      // 隐藏快速提示
      this.hideQuickHint();
    } else {
      showStatusMessage('放置失败，请重试', 'error');
    }
  }

  // 清理拖拽状态
  clearDragState() {
    // 清除拖拽的单词
    this.draggedWord = null;
    
    // 清除所有拖拽样式
    document.querySelectorAll('.word-item.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
    
    // 清除悬停状态
    document.querySelectorAll('.grid-cell.hovered').forEach(cell => {
      cell.classList.remove('hovered');
    });
    
    // 清除单词预览
    this.clearWordPreview();
    
    // 隐藏方向显示
    this.hideDirectionDisplay();
    
    // 隐藏快速提示
    this.hideQuickHint();
    
    console.log('已清理拖拽状态');
  }
  
  // 添加新单词到列表
  addWord(wordInput) {
    // 处理两种情况：直接输入文本框的值，或传入的参数值
    let wordText;
    if (wordInput) {
      if (typeof wordInput === 'string') {
        wordText = wordInput.trim().toUpperCase();
      } else if (typeof wordInput === 'object' && wordInput !== null && wordInput.word) {
        wordText = wordInput.word.trim().toUpperCase();
      } else {
        try { wordText = String(wordInput).trim().toUpperCase(); } catch { wordText = ''; }
      }
    } else {
      wordText = this.newWordInput.value.trim().toUpperCase();
    }
    if (!wordText) {
      showStatusMessage('请输入单词', 'error');
      return;
    }
    // 不再做只允许字母的校验，允许任意字符
    const wordExists = this.words.some(item => {
      if (typeof item === 'string') return item.toUpperCase() === wordText;
      else if (typeof item === 'object' && item && item.word) return item.word.toUpperCase() === wordText;
      return false;
    });
    if (wordExists) {
      showStatusMessage('该单词已在列表中', 'error');
      return;
    }
    this.words.push(wordText);
    this.renderWordList();
    if (!wordInput) this.newWordInput.value = '';
    showStatusMessage(`已添加单词: ${wordText}`);
  }
  
  // 从列表中移除单词
  removeWord(word) {
    this.words = this.words.filter(w => w !== word);
    this.renderWordList();
    
    showStatusMessage(`已移除单词: ${word}`);
  }
  
  // 渲染单词列表

  
  // 显示方向提示
  showDirectionDisplay() {
    let directionDisplay = document.getElementById('direction-display');
    if (!directionDisplay) {
      directionDisplay = document.createElement('div');
      directionDisplay.id = 'direction-display';
      document.body.appendChild(directionDisplay);
    }
    
    this.updateDirectionDisplay();
    directionDisplay.style.display = 'block';
  }
  
  // 更新方向提示内容
  updateDirectionDisplay() {
    const directionDisplay = document.getElementById('direction-display');
    if (!directionDisplay) return;
    
    const directionNames = {
      horizontal: '水平向右 → (0°)',
      diagonalUp: '右上方向 ↗ (45°)',
      reverseVertical: '垂直向上 ↑ (90°)',
      reverseDiagonalUp: '左上方向 ↖ (135°)',
      reverseHorizontal: '水平向左 ← (180°)',
      reverseDiagonal: '左下方向 ↙ (225°)',
      vertical: '垂直向下 ↓ (270°)',
      diagonal: '右下方向 ↘ (315°)'
    };
    
    directionDisplay.innerHTML = `
      <div>当前方向: <strong>${directionNames[this.dragDirection]}</strong></div>
      <div class="direction-help">按 R 键切换方向</div>
    `;
  }
  
  // 隐藏方向提示
  hideDirectionDisplay() {
    const directionDisplay = document.getElementById('direction-display');
    if (directionDisplay) {
      directionDisplay.style.display = 'none';
    }
  }
  
  // 返回单词列表数据
  getWordListData() {
    return {
      words: this.words
    };
  }
  
  // 从数据加载单词列表
  loadFromData(data) {
    // 清理拖拽状态
    this.clearDragState();
    
    if (!data || !data.words || !Array.isArray(data.words)) {
      return false;
    }
    
    this.words = data.words;
    this.renderWordList();
    return true;
  }
  
  // 从网格中移除指定单词
  removeWordFromGrid(word) {
    // 查找单词在已放置列表中的索引
    const wordIndex = this.grid.placedWords.findIndex(placedWord => placedWord.word === word);
    if (wordIndex !== -1) {
      // 获取单词的颜色，用于移除后更新colorMap
      const wordColor = this.grid.colorMap[word];
      
      // 移除单词
      this.grid.removeWordFromGrid(wordIndex);
      
      // 重新应用相同的颜色，确保下次放置时有相同颜色
      this.grid.colorMap[word] = wordColor;
      
      showStatusMessage(`已从网格中移除单词: ${word}，可以重新放置`);
      return true;
    }
    return false;
  }
  
  // 更新并监听网格变化
  setupGridChangeListener() {
    // 确保当网格中的单词发生变化时，更新单词列表的状态
    if (this.grid) {
      // 创建一个方法引用，用于在网格变化时调用
      this._onGridChange = () => {
        this.renderWordList();
      };
      
      // 添加自定义事件监听器
      document.addEventListener('wordGridChanged', this._onGridChange);
    }
  }
  
  // 重置所有单词的放置状态
  resetPlacedStatus() {
    if (!this.words) return;
    
    // 重置每个单词的放置状态
    document.querySelectorAll('#word-list li').forEach(li => {
      li.classList.remove('placed');
    });
    
    // 更新内部状态
    this.placedWords = [];
    
    console.log('已重置所有单词的放置状态');
  }
  
  // 清空单词列表
  clearWords() {
    // 清理拖拽状态
    this.clearDragState();
    
    this.words = [];
    this.renderWordList();
    console.log('单词列表已清空');
  }
  
  // 渲染词频统计信息
  renderFrequencyStats() {
    if (!this.wordFrequency || !this.wordFrequency.isLoaded) {
      console.log('📊 词频数据未加载，跳过统计渲染');
      return;
    }
    
    const statsContainer = document.createElement('div');
    statsContainer.className = 'frequency-stats';
    
    const stats = this.wordFrequency.getFrequencyStats(this.words);
    console.log('📊 词频统计结果:', stats);
    
    statsContainer.innerHTML = `
      <div class="stats-title">词频分布 (共${this.words.length}词)</div>
      <div class="stats-content">
        <span class="stat-item high">高频词: ${stats.high}</span>
        <span class="stat-item medium">中频词: ${stats.medium}</span>
        <span class="stat-item low">低频词: ${stats.low}</span>
        <span class="stat-item other">其他: ${stats.other}</span>
        <span class="stat-item unknown">未知词: ${stats.unknown}</span>
      </div>
    `;
    
    this.wordListElement.appendChild(statsContainer);
  }

  // 添加已放置的单词
  addPlacedWord(wordData) {
    if (!wordData) return;
    let wordText = '';
    if (typeof wordData === 'string') wordText = wordData.trim().toUpperCase();
    else if (typeof wordData === 'object' && wordData !== null && wordData.word) wordText = wordData.word.trim().toUpperCase();
    else return;
    if (!wordText) return;
    // 不再做字母校验，允许所有字符
    const existingIndex = this.words.findIndex(w => {
      if (typeof w === 'string') return w.toUpperCase() === wordText;
      else if (typeof w === 'object' && w !== null && w.word) return w.word.toUpperCase() === wordText;
      return false;
    });
    if (existingIndex !== -1) {
      this.words[existingIndex] = wordText;
    } else {
      this.words.push(wordText);
    }
    this.renderWordList();
  }

  // 渲染单词列表
  renderWordList() {
    this.wordListElement.innerHTML = '';
    
    // 添加词频统计信息
    if (this.words.length > 0) {
      this.renderFrequencyStats();
    }
    
    this.words.forEach((word, index) => {
      const li = document.createElement('li');
      li.className = 'word-item';
      
      // 检查单词是否已放置
      const placedWordData = this.grid.placedWords.find(placedWord => placedWord.word === word);
      if (placedWordData) {
        li.classList.add('placed');
        // 使用单词分配的颜色作为背景色
        const wordColor = placedWordData.color || this.grid.colorMap[word];
        if (wordColor) {
          li.style.backgroundColor = wordColor + '33'; // 添加透明度
          li.style.borderColor = wordColor;
        }
      }
      
      // 创建单词信息容器
      const wordInfo = document.createElement('div');
      wordInfo.className = 'word-info';
      
      // 单词文本
      const wordText = document.createElement('span');
      wordText.className = 'word-text';
      wordText.textContent = word;
      wordInfo.appendChild(wordText);
      
      // 已放置的单词通过背景色显示，不需要额外的标记
      
      // 添加词频标识
      const frequencyIndicator = this.createFrequencyIndicator(word);
      wordInfo.appendChild(frequencyIndicator);
      
      li.appendChild(wordInfo);
      
      // 添加单词操作按钮
      const actions = document.createElement('div');
      actions.className = 'word-actions';
      
      // 删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-word';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = '删除单词';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeWord(word);
      });
      actions.appendChild(deleteBtn);
      
      li.appendChild(actions);
      
      // 点击切换拖拽模式
      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-word')) return;
        if (e.target.classList.contains('frequency-detail-btn')) return;
        
        // 如果当前单词已经在拖拽模式，则退出拖拽模式
        if (this.draggedWord === word) {
          this.clearDragState();
          return;
        }
        
        // 清除其他单词的拖拽状态
        this.clearDragState();
        
        // 进入当前单词的拖拽模式
        this.draggedWord = word;
        this.dragDirection = 'horizontal';
        li.classList.add('dragging');
        
        // 显示方向指示器
        this.showDirectionDisplay();
        
        console.log(`单词 "${word}" 进入拖拽模式，点击网格放置或再次点击退出`);
      });
      
      this.wordListElement.appendChild(li);
    });
  }
  
  // 创建词频指示器
  createFrequencyIndicator(word) {
    console.log(`🏷️ 为单词 "${word}" 创建词频指示器`);
    
    const indicator = document.createElement('div');
    indicator.className = 'frequency-indicator';
    
    if (!this.wordFrequency || !this.wordFrequency.isLoaded) {
      console.log(`⏳ 词频数据未加载，显示等待状态`);
      indicator.innerHTML = '<span class="frequency-loading">⏳</span>';
      return indicator;
    }
    
    // 获取词频信息
    const wordInfo = this.wordFrequency.getWordFrequencyInfo(word);
    console.log(`📊 单词 "${word}" 词频信息:`, wordInfo);
    
    // 创建词频标签
    const freqTag = document.createElement('span');
    freqTag.className = `frequency-tag ${wordInfo.level}`;
    freqTag.textContent = wordInfo.levelName;
    freqTag.style.backgroundColor = wordInfo.color;
    freqTag.style.color = 'white';
    freqTag.style.padding = '2px 6px';
    freqTag.style.borderRadius = '3px';
    freqTag.style.fontSize = '12px';
    freqTag.title = `词频: ${wordInfo.levelName} (${wordInfo.rank || '未知'})`;
    
    indicator.appendChild(freqTag);
    
    // 关卡使用统计
    if (wordInfo.levelStats.isReady) {
      const statsIndicator = document.createElement('span');
      statsIndicator.className = 'level-stats-indicator';
      
      if (wordInfo.levelStats.isFirstTime) {
        // 新单词标识
        statsIndicator.innerHTML = '<span class="new-word-icon" title="首次使用">✨</span>';
      } else {
        // 使用次数显示
        const totalCount = wordInfo.levelStats.totalCount;
        const recent5Count = wordInfo.levelStats.recent5Count;
        
        statsIndicator.innerHTML = `
          <span class="usage-count" title="总使用次数: ${totalCount}, 近5关: ${recent5Count}">
            ${totalCount}
          </span>
        `;
        
        // 根据使用频率设置颜色
        if (totalCount >= 5) {
          statsIndicator.classList.add('high-usage');
        } else if (totalCount >= 3) {
          statsIndicator.classList.add('medium-usage');
        } else {
          statsIndicator.classList.add('low-usage');
        }
      }
      
      indicator.appendChild(statsIndicator);
    }
    
    // 词频详情按钮
    const detailBtn = document.createElement('button');
    detailBtn.className = 'frequency-detail-btn';
    detailBtn.innerHTML = '!';
    detailBtn.title = '查看词频详情';
    detailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showWordFrequencyDetail(word);
    });
    
    indicator.appendChild(detailBtn);
    
    return indicator;
  }
} 