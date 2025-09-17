class Grid {
  constructor() {
    this.width = 6; // 默认宽度
    this.height = 6; // 默认高度
    this.gridElement = document.getElementById('grid');
    this.letters = []; // 二维数组存储字母
    this.placedWords = []; // 存储已放置的单词和它们的位置信息
    this.colorMap = {}; // 存储单词对应的颜色
    this.dictionarySet = new Set(); // 用于存储字典Set
    this.modalInitialized = false; // 追踪模态框是否已初始化
    
    // 特殊关卡配置
    this.specialLevelConfig = {
      isGoldLevel: false,
      isBlackDotLevel: false
    };
    
    // 字母频率（英语中常见字母频率，从高到低）
    this.letterFrequency = {
      // 高频字母
      'E': 12.7, 'T': 9.1, 'A': 8.2, 'O': 7.5, 'I': 7.0, 'N': 6.7, 'S': 6.3, 'H': 6.1, 'R': 6.0, 'D': 4.3, 'L': 4.0,
      // 中频字母
      'U': 2.8, 'C': 2.8, 'M': 2.4, 'W': 2.4, 'F': 2.2, 'G': 2.0, 'Y': 2.0, 'P': 1.9, 'B': 1.5,
      // 低频字母
      'V': 1.0, 'K': 0.8, 'J': 0.2, 'X': 0.2, 'Q': 0.1, 'Z': 0.1
    };
    
    // 预定义一组用于单词的颜色
    this.predefinedColors = [
      '#e74c3c', // 红色
      '#3498db', // 蓝色
      '#2ecc71', // 绿色
      '#f39c12', // 橙色
      '#9b59b6', // 紫色
      '#1abc9c', // 青色
      '#d35400', // 深橙色
      '#27ae60', // 深绿色
      '#2980b9', // 深蓝色
      '#8e44ad', // 深紫色
      '#16a085', // 深青色
      '#f1c40f', // 黄色
      '#e67e22', // 浅橙色
      '#c0392b', // 深红色
      '#7f8c8d', // 灰色
    ];
    
    // 初始化二维数组
    this.initializeGrid();
    console.log('网格已初始化，宽度:', this.width, '高度:', this.height);
    
    // 加载字典
    this.loadDictionary();
    
    // 添加bonusWord高亮样式
    this.addBonusWordStyles();
    
    // 初始化模态框
    this.initBonusWordsModal([]);
    this.initRefreshBonusButton();
    this.initDuplicateCheckModal();
    
    // 初始化预览功能
    this.initPreview();
    
    // 初始化重置按钮
    this.initResetButton();
  }

  initializeGrid() {
    // 重置网格数据
    this.letters = Array(this.height).fill().map(() => Array(this.width).fill(''));
    this.placedWords = [];
    
    // 更新CSS网格列数
    this.gridElement.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
    
    // 清空网格
    this.gridElement.innerHTML = '';
    
    // 计算合适的单元格尺寸
    this.adjustCellSize();
    
    // 创建网格单元格
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // 添加双击事件用于直接编辑字母
        cell.addEventListener('dblclick', (e) => {
          e.stopPropagation(); // 防止冒泡
          this.handleCellEdit(row, col);
        });
        
        this.gridElement.appendChild(cell);
      }
    }
    
    // 清空已放置单词列表
    document.getElementById('placed-words').innerHTML = '';
  }
  
  // 根据网格尺寸调整单元格大小
  adjustCellSize() {
    const gridContainer = this.gridElement.parentElement;
    const containerWidth = gridContainer.clientWidth;
    const containerHeight = gridContainer.clientHeight;
    
    // 计算合适的缩放因子
    const maxCellSize = Math.min(
      (containerWidth - 20) / this.width,
      (containerHeight - 20) / this.height
    );
    
    // 限制单元格的最大尺寸
    const cellSize = Math.min(maxCellSize, 40);
    
    // 应用网格宽度，使其居中
    const gridWidth = cellSize * this.width;
    this.gridElement.style.maxWidth = `${gridWidth}px`;
    
    // 设置网格字体大小，根据单元格大小按比例缩放
    const fontSize = Math.max(12, Math.min(cellSize * 0.5, 18));
    this.gridElement.style.fontSize = `${fontSize}px`;
  }

  // 处理单元格双击编辑
  handleCellEdit(row, col) {
    // 创建一个输入框覆盖在单元格上
    const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    // 保存原始内容和样式，用于取消编辑时恢复
    const originalContent = this.letters[row][col];
    const originalBackgroundColor = cell.style.backgroundColor;
    const originalColor = cell.style.color;
    const originalBorderColor = cell.style.borderColor;
    
    // 创建一个输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-edit-input';
    input.value = originalContent;
    input.maxLength = 1; // 限制只能输入一个字符
    
    // 设置输入框样式，使其覆盖整个单元格
    input.style.position = 'absolute';
    input.style.top = '0';
    input.style.left = '0';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.fontSize = 'inherit';
    input.style.textAlign = 'center';
    input.style.border = 'none';
    input.style.outline = 'none';
    input.style.background = '#fff';
    input.style.zIndex = '10';
    
    // 临时清除单元格内容
    cell.textContent = '';
    cell.style.position = 'relative';
    
    // 添加输入框到单元格
    cell.appendChild(input);
    
    // 自动聚焦并选中内容
    input.focus();
    input.select();
    
    // 处理按键事件
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // 按回车键确认编辑
        input.blur();
      } else if (e.key === 'Escape') {
        // 按ESC键取消编辑
        input.value = originalContent;
        input.blur();
      }
    });
    
    // 添加输入框自动转大写功能
    input.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    });
    
    // 处理失去焦点事件，应用编辑结果
    input.addEventListener('blur', () => {
      // 获取输入内容并转为大写
      let newValue = input.value.trim().toUpperCase();
      
      // 移除输入框
      input.remove();
      
      // 如果输入内容没变化，恢复原样
      if (newValue === originalContent) {
        cell.textContent = originalContent;
        return;
      }
      
      // 应用新内容
      this.updateManualCell(row, col, newValue);
      
      // 检查是否有单词被改动
      this.checkPlacedWords();
    });
  }
  
  // 手动更新单元格内容
  updateManualCell(row, col, letter) {
    // 更新数据
    this.letters[row][col] = letter;
    
    // 更新UI
    const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    cell.textContent = letter;
    
    // 检查此单元格是否属于已放置的单词
    let belongsToWord = false;
    let wordColor = null;
    let isDraggedWord = false;
    
    // 查找使用此单元格的单词
    for (const { word, positions, color, isDragged } of this.placedWords) {
      if (positions.some(pos => pos.row === row && pos.col === col)) {
        belongsToWord = true;
        wordColor = color;
        if (isDragged) {
          isDraggedWord = true;
        }
        break;
      }
    }
    
    // 更新样式
    if (letter) {
      if (belongsToWord && wordColor) {
        // 如果属于某个单词，保持单词颜色
        cell.classList.add('placed');
        cell.classList.remove('manual');
        
        // 拖拽单词使用更深的背景色
        if (isDraggedWord) {
          cell.style.backgroundColor = wordColor;
          cell.style.borderColor = this.adjustColor(wordColor, -40);
        } else {
          // 非拖拽单词使用淡绿色
          cell.style.backgroundColor = '#e8f5e9'; // 淡绿色
          cell.style.borderColor = '#c8e6c9';
        }
        cell.style.color = '#000000';
        cell.style.fontWeight = 'bold';
      } else {
        // 手动输入的字母，也使用淡绿色
        cell.classList.add('manual');
        cell.classList.remove('placed');
        cell.style.backgroundColor = '#e8f5e9'; // 淡绿色
        cell.style.borderColor = '#c8e6c9';
        cell.style.color = '#000000';
      }
    } else {
      // 空格，清除所有样式
      cell.classList.remove('placed', 'manual');
      cell.style.backgroundColor = '';
      cell.style.borderColor = '';
      cell.style.color = '';
    }
    
    showStatusMessage(`已更新单元格 (${row},${col}) 为: ${letter || '空'}`);
    
    // 手动修改字母后，自动刷新bonus words
    this.detectBonusWords();
  }
  
  // 用于从wordList中通过点击进行单词放置的处理
  handleCellClick(row, col) {
    // 如果没有正在拖拽的单词，则转为编辑模式
    if (!window.wordListInstance || !window.wordListInstance.draggedWord) {
      this.handleCellEdit(row, col);
      return;
    }
  }

  updateCell(row, col, letter, color = null) {
    // 更新数据
    this.letters[row][col] = letter;
    
    // 更新UI
    const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    cell.textContent = letter;
    
    // 检查此单元格是否属于多个单词（交叉点）
    const wordsAtCell = [];
    let isDraggedWord = false;
    let cellColor = color;
    let draggedWordColor = null;
    
    // 先检查所有单词，收集信息
    for (const placedWord of this.placedWords) {
      const { word, positions, isDragged } = placedWord;
      
      // 检查这个单词是否使用这个单元格
      const usesThisCell = positions.some(pos => pos.row === row && pos.col === col);
      if (usesThisCell) {
        wordsAtCell.push(word);
        
        // 如果是拖拽单词，记录它的颜色和状态
        if (isDragged) {
          isDraggedWord = true;
          draggedWordColor = this.colorMap[word];
        }
      }
    }
    
    // 如果有拖拽单词的颜色，优先使用它
    if (draggedWordColor) {
      cellColor = draggedWordColor;
    } else if (!cellColor && wordsAtCell.length > 0) {
      // 否则使用第一个找到的单词的颜色
      cellColor = this.colorMap[wordsAtCell[0]];
    }
    
    // 更新样式
    if (letter) {
      // 重置样式，确保刷新
      cell.className = 'grid-cell';
      cell.style.backgroundColor = '';
      cell.style.background = '';
      cell.style.borderColor = '';
      cell.style.color = '';
      cell.style.textShadow = '';
      cell.style.fontWeight = '';
      
      cell.classList.add('placed');
      
      if (wordsAtCell.length > 1) {
        // 如果是交叉点，使用特殊样式
        cell.classList.add('intersection');
        
        // 使用渐变效果混合多个单词的颜色
        if (wordsAtCell.length === 2) {
          // 如果其中有拖拽单词，确保它的颜色更明显
          let color1, color2;
          if (isDraggedWord) {
            color1 = draggedWordColor;
            color2 = this.colorMap[wordsAtCell.find(w => this.colorMap[w] !== draggedWordColor)];
          } else {
            color1 = this.colorMap[wordsAtCell[0]];
            color2 = this.colorMap[wordsAtCell[1]];
          }
          
          // 使用垂直或对角线分隔的双色渐变
          cell.style.background = `linear-gradient(135deg, ${color1} 0%, ${color1} 49%, ${color2} 51%, ${color2} 100%)`;
          
          // 为交叉点设置特殊边框
          cell.style.borderColor = '#333';
          cell.style.borderWidth = '2px';
          
        } else {
          // 如果有更多单词交叉，使用固定的高亮样式
          cell.style.backgroundColor = '#f39c12'; // 橙色高亮
          cell.style.borderColor = '#e67e22';
        }
        // 设置文字颜色为黑色，确保可读性
        cell.style.color = '#000000';
        cell.style.fontWeight = 'bold';
      } else if (cellColor) {
        // 单个单词的正常样式
        cell.style.background = '';
        
        // 拖拽单词使用更深、更明显的背景色
        if (isDraggedWord) {
          cell.style.backgroundColor = cellColor;
          cell.style.borderColor = this.adjustColor(cellColor, -40);
        } else {
          // 非拖拽单词使用淡绿色
          cell.style.backgroundColor = '#e8f5e9'; // 淡绿色
          cell.style.borderColor = '#c8e6c9';
        }
        cell.style.color = '#000000';
        cell.style.fontWeight = 'bold';
      } else {
        // 手动输入的字母，也使用淡绿色背景
        cell.classList.add('manual');
        cell.classList.remove('placed');
        cell.style.backgroundColor = '#e8f5e9'; // 淡绿色
        cell.style.borderColor = '#c8e6c9';
        cell.style.color = '#000000';
      }
    } else {
      // 清空单元格
      cell.className = 'grid-cell';
      cell.style.background = '';
      cell.style.backgroundColor = '';
      cell.style.borderColor = '';
      cell.style.color = '';
      cell.style.textShadow = '';
      cell.style.fontWeight = '';
    }
  }
  
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.initializeGrid();
    
    // 窗口大小改变时重新调整单元格大小
    window.addEventListener('resize', () => {
      this.adjustCellSize();
    });
  }

  // 动态增加网格宽度
  increaseWidth() {
    if (this.width >= 20) {
      showStatusMessage('网格宽度已达到最大值20', 'warning');
      return false;
    }
    
    this.width++;
    this.resizeGrid();
    this.updateGridSizeDisplay();
    showStatusMessage(`网格宽度增加至 ${this.width}`, 'success');
    return true;
  }

  // 动态减少网格宽度
  decreaseWidth() {
    if (this.width <= 5) {
      showStatusMessage('网格宽度不能小于5', 'warning');
      return false;
    }
    
    // 检查最右侧一列是否有字母
    for (let row = 0; row < this.height; row++) {
      if (this.letters[row][this.width - 1] !== '') {
        showStatusMessage('最右侧一列有字母，无法缩小宽度', 'error');
        return false;
      }
    }
    
    this.width--;
    this.resizeGrid();
    this.updateGridSizeDisplay();
    showStatusMessage(`网格宽度减少至 ${this.width}`, 'success');
    return true;
  }

  // 动态增加网格高度
  increaseHeight() {
    if (this.height >= 20) {
      showStatusMessage('网格高度已达到最大值20', 'warning');
      return false;
    }
    
    this.height++;
    this.resizeGrid();
    this.updateGridSizeDisplay();
    showStatusMessage(`网格高度增加至 ${this.height}`, 'success');
    return true;
  }

  // 动态减少网格高度
  decreaseHeight() {
    if (this.height <= 5) {
      showStatusMessage('网格高度不能小于5', 'warning');
      return false;
    }
    
    // 检查最下面一行是否有字母
    for (let col = 0; col < this.width; col++) {
      if (this.letters[this.height - 1][col] !== '') {
        showStatusMessage('最下面一行有字母，无法缩小高度', 'error');
        return false;
      }
    }
    
    this.height--;
    this.resizeGrid();
    this.updateGridSizeDisplay();
    showStatusMessage(`网格高度减少至 ${this.height}`, 'success');
    return true;
  }

  // 调整网格大小（保持现有数据）
  resizeGrid() {
    const oldLetters = this.letters;
    
    // 创建新的字母数组
    this.letters = Array(this.height).fill().map(() => Array(this.width).fill(''));
    
    // 复制旧数据到新数组（在范围内的部分）
    for (let row = 0; row < Math.min(this.height, oldLetters.length); row++) {
      for (let col = 0; col < Math.min(this.width, oldLetters[row].length); col++) {
        this.letters[row][col] = oldLetters[row][col];
      }
    }
    
    // 更新DOM
    this.updateGridDOM();
    
    // 触发网格变化事件
    this.triggerGridChangeEvent();
  }

  // 更新网格DOM结构
  updateGridDOM() {
    // 更新CSS网格列数
    this.gridElement.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
    
    // 清空网格
    this.gridElement.innerHTML = '';
    
    // 重新计算单元格尺寸
    this.adjustCellSize();
    
    // 收集所有属于已放置单词的位置
    const wordPositions = new Set();
    this.placedWords.forEach(wordData => {
      wordData.positions.forEach(pos => {
        wordPositions.add(`${pos.row},${pos.col}`);
      });
    });
    
    // 重新创建网格单元格
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = this.letters[row][col];
        
        // 只有不属于已放置单词的字母才设置为manual样式
        const isWordPosition = wordPositions.has(`${row},${col}`);
        if (this.letters[row][col] && !isWordPosition) {
          cell.classList.add('manual');
          cell.style.backgroundColor = '#e8f5e9';
          cell.style.borderColor = '#c8e6c9';
          cell.style.color = '#000000';
        }
        
        // 添加双击事件用于直接编辑字母
        cell.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.handleCellEdit(row, col);
        });
        
        this.gridElement.appendChild(cell);
      }
    }
    
    // 重新绘制已放置的单词
    this.redrawPlacedWords();
  }

  // 重新绘制已放置的单词样式
  redrawPlacedWords() {
    // 收集所有单词位置
    const allWordPositions = new Set();
    this.placedWords.forEach(wordData => {
      wordData.positions.forEach(pos => {
        if (pos.row < this.height && pos.col < this.width) {
          allWordPositions.add(`${pos.row},${pos.col}`);
        }
      });
    });
    
    // 清除所有单词相关的样式
    this.gridElement.querySelectorAll('.grid-cell').forEach(cell => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const posKey = `${row},${col}`;
      
      cell.classList.remove('placed', 'intersection');
      
      // 如果这个位置属于单词，清除所有样式（包括manual样式）
      if (allWordPositions.has(posKey)) {
        cell.classList.remove('manual');
        cell.style.backgroundColor = '';
        cell.style.borderColor = '';
        cell.style.color = '';
      } else if (!cell.classList.contains('manual')) {
        // 对于非manual单元格，清除样式
        cell.style.backgroundColor = '';
        cell.style.borderColor = '';
        cell.style.color = '';
      }
    });
    
    // 重新应用已放置单词的样式
    this.placedWords.forEach((wordData, index) => {
      // 优先使用wordData中保存的颜色，确保颜色不变
      const color = wordData.color || this.colorMap[wordData.word] || this.predefinedColors[index % this.predefinedColors.length];
      
      // 确保colorMap中也有正确的颜色映射
      if (!this.colorMap[wordData.word]) {
        this.colorMap[wordData.word] = color;
      }
      
      wordData.positions.forEach((pos, posIndex) => {
        // 检查位置是否在新的网格范围内
        if (pos.row < this.height && pos.col < this.width) {
          const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
          if (cell) {
            cell.classList.add('placed');
            
            // 检查是否是交叉位置
            const isIntersection = this.isIntersectionCell(pos.row, pos.col);
            if (isIntersection) {
              cell.classList.add('intersection');
              this.applyIntersectionStyle(cell, pos.row, pos.col);
            } else {
              cell.style.backgroundColor = color;
              cell.style.borderColor = this.darkenColor(color, 20);
              cell.style.color = '#000000';  // 改为黑色，与原始样式保持一致
              cell.style.fontWeight = 'bold';
            }
          }
        }
      });
    });
  }

  // 更新网格大小显示
  updateGridSizeDisplay() {
    const displayElement = document.getElementById('grid-size-display');
    if (displayElement) {
      displayElement.textContent = `${this.width}x${this.height}`;
    }
  }

  // 检查指定位置是否是交叉位置（多个单词共享）
  isIntersectionCell(row, col) {
    let count = 0;
    for (const wordData of this.placedWords) {
      if (wordData.positions.some(pos => pos.row === row && pos.col === col)) {
        count++;
        if (count > 1) {
          return true;
        }
      }
    }
    return false;
  }

  // 为交叉位置应用特殊样式
  applyIntersectionStyle(cell, row, col) {
    // 收集所有在此位置的单词的颜色
    const colors = [];
    for (const wordData of this.placedWords) {
      if (wordData.positions.some(pos => pos.row === row && pos.col === col)) {
        colors.push(wordData.color);
      }
    }
    
    if (colors.length > 1) {
      // 创建渐变背景来显示交叉效果
      const gradient = `linear-gradient(45deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
      cell.style.background = gradient;
      cell.style.borderColor = this.darkenColor(colors[0], 30);
      cell.style.color = '#000000';  // 改为黑色
      cell.style.fontWeight = 'bold';
    } else if (colors.length === 1) {
      // 如果只有一种颜色，使用常规样式
      cell.style.backgroundColor = colors[0];
      cell.style.borderColor = this.darkenColor(colors[0], 20);
      cell.style.color = '#000000';  // 改为黑色
      cell.style.fontWeight = 'bold';
    }
  }

  // 使颜色变暗
  darkenColor(color, percent) {
    if (!color) return '#000000';
    
    // 如果是hex颜色
    if (color.startsWith('#')) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;
      return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255))
        .toString(16).slice(1);
    }
    
    // 如果是其他格式，返回默认值
    return color;
  }
  
  // 为单词分配颜色
  assignColorToWord(word) {
    // 如果单词已有颜色，直接返回
    if (this.colorMap[word]) {
      return this.colorMap[word];
    }
    
    // 预定义一组更鲜艳的颜色，适合作为拖拽单词的背景色
    const deeperColors = [
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
    
    // 基于单词内容生成一致的颜色索引（而不是随机）
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    const colorIndex = Math.abs(hash) % deeperColors.length;
    const color = deeperColors[colorIndex];
    
    // 存储单词的颜色
    this.colorMap[word] = color;
    
    return color;
  }

  // 手动放置单词
  placeWord(word, startRow, startCol, direction, isDragged = true) {
    if (!word) return false;
    
    word = word.toUpperCase();
    const directions = {
      horizontal: { rowChange: 0, colChange: 1 },
      vertical: { rowChange: 1, colChange: 0 },
      diagonal: { rowChange: 1, colChange: 1 },
      reverseDiagonal: { rowChange: 1, colChange: -1 },
      reverseHorizontal: { rowChange: 0, colChange: -1 },
      reverseVertical: { rowChange: -1, colChange: 0 },
      diagonalUp: { rowChange: -1, colChange: 1 },
      reverseDiagonalUp: { rowChange: -1, colChange: -1 }
    };
    
    const { rowChange, colChange } = directions[direction];
    
    // 检查单词是否可以放置（边界和字母匹配条件）
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      
      // 检查边界
      if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
        return false;
      }
      
      // 检查单元格中的现有字母
      const existingLetter = this.letters[row][col];
      
      // 如果单元格已有字母，检查是否与新单词的字母匹配
      if (existingLetter && existingLetter !== word[i]) {
        // 如果是拖拽单词，检查是否冲突
        if (isDragged) {
          // 检查此位置是否属于其他拖拽单词
          for (const placedWord of this.placedWords) {
            if (placedWord.isDragged && placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
              // 如果发现此位置已有拖拽单词，且字母不匹配，则不允许放置
              showStatusMessage(`位置 (${row},${col}) 的字母 "${existingLetter}" 与单词 "${word}" 中的字母 "${word[i]}" 不匹配`, 'error');
              return false;
            }
          }
        } else {
          // 如果是非拖拽单词，不允许字母冲突
          showStatusMessage(`位置 (${row},${col}) 的字母 "${existingLetter}" 与单词 "${word}" 中的字母 "${word[i]}" 不匹配`, 'error');
          return false;
        }
      }
    }
    
    // 检查单词是否已经放置在网格上
    const existingIndex = this.placedWords.findIndex(placedWord => placedWord.word === word);
    if (existingIndex !== -1) {
      // 如果单词已放置，移除它
      this.removeWordFromGrid(existingIndex, false);
    }
    
    // 查找将被新单词覆盖的现有单词（仅非拖拽单词可以被覆盖）
    const affectedPositions = [];
    const affectedWords = new Set();
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      affectedPositions.push({ row, col });
      
      // 检查该位置是否有现有单词且字母不匹配
      // 只有当字母不匹配时才需要移除覆盖的单词
      const existingLetter = this.letters[row][col];
      if (existingLetter && existingLetter !== word[i]) {
        for (const [idx, placedWord] of this.placedWords.entries()) {
          if (placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
            // 拖拽单词不能被覆盖
            if (placedWord.isDragged && !isDragged) {
              return false;
            }
            // 否则，将此单词添加到受影响的单词列表
            affectedWords.add(idx);
          }
        }
      }
    }
    
    // 如果有被覆盖的单词，从放置列表中移除
    if (affectedWords.size > 0) {
      // 按照索引从大到小排序，以便正确移除
      const affectedIndices = Array.from(affectedWords).sort((a, b) => b - a);
      
      // 收集受影响的单词名称，用于显示消息
      const affectedWordNames = affectedIndices.map(idx => this.placedWords[idx].word);
      
      // 从后向前移除，以免索引变化
      for (const idx of affectedIndices) {
        // 移除单词时不需要清空格子，因为即将被新单词覆盖
        this.placedWords.splice(idx, 1);
      }
      
      // 显示被覆盖的单词
      showStatusMessage(`新单词"${word}"覆盖了: ${affectedWordNames.join(', ')}`, 'warning');
    }
    
    // 为单词分配颜色
    const color = this.assignColorToWord(word);
    
    // 找出所有位置
    const positions = [];
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      positions.push({ row, col });
    }
    
    // 先将单词添加到已放置单词列表
    this.placedWords.push({
      word,
      positions,
      direction,
      color,
      isDragged
    });
    
    // 更新单元格
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * rowChange;
      const col = startCol + i * colChange;
      
      // 强制更新单元格，无论是否有相同字母
      this.updateCell(row, col, word[i], color);
    }
    
    // 更新已放置单词UI
    this.updatePlacedWordsList();
    
    // 触发网格变化事件
    this.triggerGridChangeEvent();
    
    return true;
  }
  
  // 检查已放置的单词是否被改动
  checkPlacedWords() {
    const invalidWords = [];
    
    this.placedWords = this.placedWords.filter(({ word, positions }) => {
      // 检查每个位置的字母是否与单词匹配
      const stillValid = positions.every((pos, index) => 
        this.letters[pos.row][pos.col] === word[index]
      );
      
      if (!stillValid) {
        invalidWords.push(word);
      }
      
      return stillValid;
    });
    
    // 如果有单词被改动，更新UI
    if (invalidWords.length > 0) {
      this.updatePlacedWordsList();
      showStatusMessage(`已移除被改动的单词: ${invalidWords.join(', ')}`);
    }
  }
  
  // 更新已放置单词列表UI
  updatePlacedWordsList() {
    const placedWordsList = document.getElementById('placed-words');
    placedWordsList.innerHTML = '';
    
    // 先显示拖拽单词，再显示其他单词
    const draggedWords = this.placedWords.filter(wordData => wordData.isDragged);
    const otherWords = this.placedWords.filter(wordData => !wordData.isDragged);
    
    // 添加拖拽单词标题
    if (draggedWords.length > 0) {
      const draggedHeader = document.createElement('div');
      draggedHeader.className = 'words-section-header dragged';
      draggedHeader.textContent = '拖拽放置的单词（无法覆盖）';
      placedWordsList.appendChild(draggedHeader);
      
      // 添加拖拽单词
      draggedWords.forEach((wordData, index) => {
        const realIndex = this.placedWords.indexOf(wordData);
        this.createWordListItem(wordData, realIndex, placedWordsList, true);
      });
    }
    
    // 添加自动填充单词标题
    if (otherWords.length > 0) {
      const otherHeader = document.createElement('div');
      otherHeader.className = 'words-section-header auto';
      otherHeader.textContent = '自动填充单词';
      placedWordsList.appendChild(otherHeader);
      
      // 添加其他单词
      otherWords.forEach((wordData, index) => {
        const realIndex = this.placedWords.indexOf(wordData);
        this.createWordListItem(wordData, realIndex, placedWordsList, false);
      });
    }
    
    // 触发网格变化事件
    this.triggerGridChangeEvent();
  }
  
  // 创建单词列表项
  createWordListItem(wordData, index, container, isDragged) {
    const { word, direction, color, positions } = wordData;
    const li = document.createElement('li');
    
    // 如果是拖拽放置的单词，添加特殊样式
    if (isDragged) {
      li.classList.add('dragged-word');
    }
    
    // 获取单词的首尾坐标
    const startPos = positions[0];
    const endPos = positions[positions.length - 1];
    
    // 创建单词文本
    const wordText = document.createElement('span');
    const directionName = this.getDirectionName(direction);
    wordText.textContent = `${word} (${directionName}) [${startPos.row},${startPos.col};${endPos.row},${endPos.col}]`;
    
    if (isDragged) {
      wordText.textContent += ' 📌'; // 添加一个图标表示拖拽放置
    }
    
    // 应用特殊单词样式
    if (wordData.isGold) {
      wordText.classList.add('gold-word');
    } else if (wordData.isBlackDot) {
      wordText.classList.add('black-dot-word');
    }
    
    // 设置单词颜色指示器
    wordText.style.borderLeft = `4px solid ${color}`;
    wordText.style.paddingLeft = '8px';
    
    // 创建特殊标记区域
    const specialMarkerDiv = document.createElement('div');
    specialMarkerDiv.className = 'word-special-marker';
    
    // 如果是金币关，添加金币勾选框
    if (this.specialLevelConfig.isGoldLevel) {
      const goldCheckbox = this.createSpecialCheckbox(
        'gold',
        index,
        wordData.isGold || false,
        '金币'
      );
      specialMarkerDiv.appendChild(goldCheckbox);
    }
    
    // 如果是黑点关，添加黑点勾选框
    if (this.specialLevelConfig.isBlackDotLevel) {
      const blackDotCheckbox = this.createSpecialCheckbox(
        'blackDot',
        index,
        wordData.isBlackDot || false,
        '黑点'
      );
      specialMarkerDiv.appendChild(blackDotCheckbox);
    }
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-word';
    deleteBtn.textContent = '×';
    deleteBtn.title = '从网格中移除此单词';
    deleteBtn.addEventListener('click', () => this.removeWordFromGrid(index));
    
    // 添加到列表项
    li.appendChild(wordText);
    
    // 如果有特殊标记选项，添加特殊标记区域
    if (specialMarkerDiv.children.length > 0) {
      li.appendChild(specialMarkerDiv);
    }
    
    li.appendChild(deleteBtn);
    
    container.appendChild(li);
  }
  
  // 创建特殊标记勾选框
  createSpecialCheckbox(type, wordIndex, isChecked, label) {
    const checkboxContainer = document.createElement('label');
    checkboxContainer.className = 'checkbox-label';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isChecked;
    checkbox.addEventListener('change', (e) => {
      this.toggleWordSpecialMark(wordIndex, type, e.target.checked);
    });
    
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    
    const labelText = document.createTextNode(label);
    
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkmark);
    checkboxContainer.appendChild(labelText);
    
    return checkboxContainer;
  }
  
  // 切换单词的特殊标记
  toggleWordSpecialMark(wordIndex, type, isChecked) {
    if (wordIndex < 0 || wordIndex >= this.placedWords.length) return;
    
    const wordData = this.placedWords[wordIndex];
    
    // 根据类型设置标记
    if (type === 'gold') {
      wordData.isGold = isChecked;
      if (isChecked) {
        // 如果选择了金币，取消黑点标记
        wordData.isBlackDot = false;
      }
    } else if (type === 'blackDot') {
      wordData.isBlackDot = isChecked;
      if (isChecked) {
        // 如果选择了黑点，取消金币标记
        wordData.isGold = false;
      }
    }
    
    // 刷新单词列表显示
    this.updatePlacedWordsList();
    
    // 显示状态消息
    const markType = wordData.isGold ? '金币' : wordData.isBlackDot ? '黑点' : '普通';
    showStatusMessage(`单词 "${wordData.word}" 已设置为${markType}单词`);
  }
  
  // 从网格中移除单词
  removeWordFromGrid(wordIndex, triggerChange = true) {
    if (wordIndex < 0 || wordIndex >= this.placedWords.length) return;
    
    const wordData = this.placedWords[wordIndex];
    
    // 确认是否删除
    if (triggerChange && !confirm(`确定要从网格中移除单词 "${wordData.word}" 吗？`)) {
      return;
    }
    
    // 从列表中移除单词
    this.placedWords.splice(wordIndex, 1);
    
    // 清除不再被任何单词使用的字母
    wordData.positions.forEach(pos => {
      // 检查此位置是否被其他单词使用
      const isUsedByOther = this.placedWords.some(otherWord => 
        otherWord.positions.some(otherPos => 
          otherPos.row === pos.row && otherPos.col === pos.col
        )
      );
      
      if (!isUsedByOther) {
        // 如果没有被其他单词使用，清除字母
        this.letters[pos.row][pos.col] = '';
        const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
          cell.textContent = '';
        }
      }
    });
    
    // 重新绘制所有已放置的单词，确保交叉点状态正确更新
    this.redrawPlacedWords();
    
    // 更新已放置单词UI
    this.updatePlacedWordsList();
    
    if (triggerChange) {
      showStatusMessage(`已从网格中移除单词: ${wordData.word}`);
      // 触发网格变化事件
      this.triggerGridChangeEvent();
      
      // 检测奖励单词
      setTimeout(() => {
        this.detectBonusWords();
      }, 100);
    }
    
    return true;
  }
  
  // 获取方向的中文名称
  getDirectionName(direction) {
    const directionNames = {
      horizontal: '水平',
      vertical: '垂直',
      diagonal: '对角线',
      reverseDiagonal: '反对角线',
      reverseHorizontal: '反水平',
      reverseVertical: '反垂直',
      diagonalUp: '对角线上',
      reverseDiagonalUp: '反对角线上'
    };
    
    return directionNames[direction] || direction;
  }
  
  // 获取当前网格的配置数据
  getGridData() {
    return {
      width: this.width,
      height: this.height,
      letters: this.letters,
      placedWords: this.placedWords
    };
  }
  
  // 获取网格大小（用于保存关卡）
  getGridSize() {
    return this.width;
  }
  
  // 设置特殊关卡配置
  setSpecialLevelConfig(config) {
    this.specialLevelConfig = {
      isGoldLevel: config.isGoldLevel || false,
      isBlackDotLevel: config.isBlackDotLevel || false
    };
    
    // 更新已放置单词列表以显示特殊标记选项
    this.updatePlacedWordsList();
  }
  
  // 获取对比色，确保文字在背景上清晰可见
  getContrastColor(hexColor) {
    // 将hex转为RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 根据亮度返回黑色或白色
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  
  // 调整颜色亮度
  adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
      ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
  }
  
  // 从数据加载网格
  loadFromData(data) {
    if (!data) {
      console.error('未提供数据，无法加载');
      return;
    }
    
    // 加载网格字母数据 - 兼容不同格式
    if (data.letters && Array.isArray(data.letters)) {
      this.loadGridLetters(data.letters);
    }
    
    // 加载已放置单词数据 - 兼容不同格式
    if (data.placedWords && Array.isArray(data.placedWords)) {
      this.loadPlacedWords(data.placedWords);
    }
    
    // 加载bonus words数据 - 如果存在
    if (data.bonusWords && Array.isArray(data.bonusWords)) {
      this.setBonusWords(data.bonusWords);
    }
    
    // 触发网格变化事件
    this.triggerGridChangeEvent();
    
    console.log('已完成数据加载');
  }

  // 异步加载字典
  loadDictionary() {
    console.log('开始加载字典...');
    
    // 检查electronAPI是否存在和readDictionary方法
    if (!window.electronAPI) {
      console.error('loadDictionary: electronAPI 不存在!');
      this.dictionarySet = new Set();
      return;
    }
    
    if (typeof window.electronAPI.readDictionary !== 'function') {
      console.error('loadDictionary: electronAPI.readDictionary 不是函数或不存在!');
      this.dictionarySet = new Set();
      return;
    }
    
    try {
      // 从electronAPI获取字典内容
      console.log('从electronAPI读取字典...');
      const dictContent = window.electronAPI.readDictionary();
      
      if (dictContent && dictContent.length > 0) {
        console.log('成功读取字典内容，大小:', dictContent.length, '字节');
        
        // 支持逗号、换行分割
        const words = dictContent.split(/,|\n|\r/).map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
        
        this.dictionarySet = new Set(words);
        console.log('字典加载完成，单词数:', this.dictionarySet.size);
        
        // 输出几个示例单词（用于调试）
        const sampleWords = Array.from(this.dictionarySet).slice(0, 5);
        console.log('字典示例单词:', sampleWords.join(', '));
      } else {
        console.warn('未能加载字典内容或字典为空');
        this.dictionarySet = new Set();
      }
    } catch (error) {
      console.error('加载字典时发生错误:', error);
      this.dictionarySet = new Set();
    }
  }

  // 检测奖励单词后，预填充模态框内容
  prefillBonusWordsModal() {
    try {
      // 获取奖励单词列表元素
      const bonusList = document.getElementById('bonus-words');
      
      if (!bonusList) return;
      
      // 如果没有奖励单词数据，显示"无奖励单词"
      if (!window.bonusWordsData || !window.bonusWordsData.wordsWithPositions || window.bonusWordsData.wordsWithPositions.length === 0) {
        bonusList.innerHTML = '<li style="grid-column: 1/-1;">无奖励单词</li>';
        return;
      }
      
      // 否则，填充奖励单词列表
      const bonusWordsWithPositions = window.bonusWordsData.wordsWithPositions;
      
      // 清空列表
      bonusList.innerHTML = '';
      
      // 填充列表项
      bonusWordsWithPositions.forEach((wordData) => {
        const li = document.createElement('li');
        if (wordData.positions && Array.isArray(wordData.positions) && wordData.positions.length > 0) {
          // 有位置信息，显示详细
          const startPos = wordData.positions[0];
          const endPos = wordData.positions[wordData.positions.length - 1];
          const directionName = this.getDirectionName(wordData.direction || 'horizontal');
          li.textContent = `${wordData.word} (${directionName}, ${startPos.row},${startPos.col}-${endPos.row},${endPos.col})`;
          // 添加点击高亮此单词的功能
          li.addEventListener('click', () => {
            this.closeBonusWordsModal();
            document.querySelectorAll('.bonus-word-highlight').forEach(cell => {
              cell.classList.remove('bonus-word-highlight');
            });
            wordData.positions.forEach(pos => {
              const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
              if (cell) {
                cell.classList.add('bonus-word-highlight');
                cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
            showStatusMessage(`已高亮显示奖励单词: ${wordData.word}`);
          });
        } else {
          // 没有位置信息，只显示单词
          li.textContent = wordData.word;
          li.className = 'bonus-word-without-position';
        }
        bonusList.appendChild(li);
      });
      
      console.log(`预填充了 ${bonusWordsWithPositions.length} 个奖励单词到模态框`);
    } catch (error) {
      console.error('预填充奖励单词模态框出错:', error);
    }
  }

  // 检测奖励单词（bonus words），逻辑与Python脚本一致
  detectBonusWords() {
    try {
      console.log('开始检测bonus words...');
      
      // 1. 获取目标单词列表
      let mainWords = [];
      if (window.wordListInstance && window.wordListInstance.words) {
        mainWords = window.wordListInstance.words.map(w => w.toUpperCase());
        console.log('主要单词列表:', mainWords, '数量:', mainWords.length);
      } else {
        console.warn('无法获取单词列表实例或单词列表为空');
      }
      
      // 检查网格是否有足够的字母
      let totalLetters = 0;
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          if (this.letters[r][c] && this.letters[r][c].trim()) {
            totalLetters++;
          }
        }
      }
      console.log('网格中字母总数:', totalLetters);
      
      // 2. 字典
      const dictSet = this.dictionarySet || new Set();
      console.log('字典大小:', dictSet.size);
      
      // 如果字典为空，尝试重新加载
      if (dictSet.size === 0) {
        console.log('字典为空，尝试重新加载...');
        this.loadDictionary();
      }
      
      // 3. 提取所有方向、正反向、长度>=3的单词
      const grid = this.letters;
      const H = this.height, W = this.width;
      
      // 存储单词及其在网格中的位置
      let wordsWithPositions = [];
      
      // 水平
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=W-c;length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r][c+i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r, col: c+i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'horizontal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseHorizontal'
              });
            }
          }
        }
      }
      
      // 垂直
      for(let c=0;c<W;c++){
        for(let r=0;r<H;r++){
          for(let length=3;length<=H-r;length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'vertical'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseVertical'
              });
            }
          }
        }
      }
      
      // 右下斜
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=Math.min(H-r,W-c);length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c+i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c+i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'diagonal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseDiagonal'
              });
            }
          }
        }
      }
      
      // 左下斜
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=Math.min(H-r,c+1);length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c-i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c-i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'reverseDiagonal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'diagonal'
              });
            }
          }
        }
      }
      
      console.log('提取到所有可能的单词数量:', wordsWithPositions.length);
      
      // 4. 目标单词
      const existingWords = new Set();
      if(this.placedWords && Array.isArray(this.placedWords)){
        this.placedWords.forEach(wd=>{
          if(wd.word) existingWords.add(wd.word.toUpperCase());
        });
      }
      console.log('已放置单词数量:', existingWords.size);
      
      // 5. 去重 (根据单词本身去重)
      const uniqueWordsMap = new Map();
      for (const wordData of wordsWithPositions) {
        if (wordData.word.length >= 3 && wordData.word.trim()) {
          // 如果单词已存在，保留最长版本
          if (!uniqueWordsMap.has(wordData.word) || 
              uniqueWordsMap.get(wordData.word).positions.length < wordData.positions.length) {
            uniqueWordsMap.set(wordData.word, wordData);
          }
        }
      }
      console.log('去重后的单词数量:', uniqueWordsMap.size);
      
      // 6. bonus = (网格单词 ∩ 字典) - 目标单词
      const bonusWordsWithPositions = Array.from(uniqueWordsMap.values()).filter(wordData => {
        const isInDict = dictSet.has(wordData.word);
        const isMainWord = mainWords.includes(wordData.word);
        const isExistingWord = existingWords.has(wordData.word);
        return isInDict && !isMainWord && !isExistingWord;
      });
      
      // 按字母顺序排序
      bonusWordsWithPositions.sort((a, b) => a.word.localeCompare(b.word));
      
      // 提取纯单词
      const bonusWords = bonusWordsWithPositions.map(wordData => wordData.word);
      
      console.log('找到bonus words数量:', bonusWords.length);
  
      // 存储奖励单词数据供模态框使用
      window.bonusWordsData = {
        words: bonusWords,
        wordsWithPositions: bonusWordsWithPositions
      };
      
      // 记录一下当前找到的奖励单词
      console.log('奖励单词列表:', bonusWords.join(', '));
      console.log('奖励单词数据对象已更新，数量:', bonusWordsWithPositions.length);
      
      // 更新模态框中的数量显示
      const bonusCountEl = document.getElementById('bonus-words-count');
      if (bonusCountEl) {
        bonusCountEl.textContent = bonusWords.length;
      }
      
      // 预填充模态框内容
      this.prefillBonusWordsModal();
      
      // 更新"查看奖励单词"按钮状态
      const viewBonusBtn = document.getElementById('view-bonus-words');
      if (viewBonusBtn) {
        if (bonusWords.length > 0) {
          viewBonusBtn.textContent = `查看奖励单词 (${bonusWords.length})`;
          viewBonusBtn.disabled = false;
          viewBonusBtn.classList.remove('disabled');
          console.log(`更新按钮状态: 显示 ${bonusWords.length} 个奖励单词`);
        } else {
          viewBonusBtn.textContent = '无奖励单词';
          viewBonusBtn.disabled = true;
          viewBonusBtn.classList.add('disabled');
          console.log('更新按钮状态: 无奖励单词');
        }
      } else {
        console.error('找不到查看奖励单词按钮');
      }
      
      if (bonusWords.length > 0) {
        console.log('部分bonus words示例:', bonusWords.slice(0, Math.min(5, bonusWords.length)).join(', '));
      }
      
      // 添加辅助样式用于高亮显示bonus word
      this.addBonusWordStyles();
      
      return bonusWords;
    } catch (error) {
      console.error('检测bonus words时出错:', error);
      return [];
    }
  }
  
  // 独立的重复单词检测函数
  checkDuplicateWords() {
    try {
      console.log('开始检查重复单词...');
      
      // 1. 获取所有主要单词（包括单词列表中的单词）
      let allMainWords = [];
      if (window.wordListInstance && window.wordListInstance.words) {
        allMainWords = window.wordListInstance.words.map(w => w.toUpperCase());
      }
      
      // 2. 获取网格中所有的字母  
      const grid = this.letters;
      const H = this.height, W = this.width;
      
      // 3. 提取所有方向、正反向、长度>=3的单词
      let wordsWithPositions = [];
      
      // 水平
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=W-c;length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r][c+i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r, col: c+i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'horizontal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseHorizontal'
              });
            }
          }
        }
      }
      
      // 垂直
      for(let c=0;c<W;c++){
        for(let r=0;r<H;r++){
          for(let length=3;length<=H-r;length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'vertical'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseVertical'
              });
            }
          }
        }
      }
      
      // 右下斜
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=Math.min(H-r,W-c);length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c+i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c+i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'diagonal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'reverseDiagonal'
              });
            }
          }
        }
      }
      
      // 左下斜
      for(let r=0;r<H;r++){
        for(let c=0;c<W;c++){
          for(let length=3;length<=Math.min(H-r,c+1);length++){
            let w = '';
            let positions = [];
            let containsEmptyCell = false;
            
            for(let i=0;i<length;i++) {
              const letter = grid[r+i][c-i];
              if(!letter || letter.trim() === '') {
                containsEmptyCell = true;
                break;
              }
              w += letter;
              positions.push({row: r+i, col: c-i});
            }
            
            if(!containsEmptyCell && w.trim()) {
              // 正向
              wordsWithPositions.push({
                word: w.toUpperCase(),
                positions: [...positions],
                direction: 'reverseDiagonal'
              });
              
              // 反向
              wordsWithPositions.push({
                word: w.toUpperCase().split('').reverse().join(''),
                positions: [...positions].reverse(),
                direction: 'diagonal'
              });
            }
          }
        }
      }
      
      console.log('提取到所有可能的单词数量:', wordsWithPositions.length);
      
      // 4. 统计单词出现次数
      const wordCount = new Map();
      wordsWithPositions.forEach(wordData => {
        if (wordData.word.length >= 3) {
          const count = wordCount.get(wordData.word) || 0;
          wordCount.set(wordData.word, count + 1);
        }
      });
      
      // 5. 找出重复的单词（出现次数>=2且在主要单词列表中）
      const allMainWordsSet = new Set(allMainWords);
      const duplicateWords = [];
      const duplicateWordsWithPositions = [];
      
      for (const [word, count] of wordCount.entries()) {
        if (count >= 2 && allMainWordsSet.has(word)) {
          duplicateWords.push(`${word}(${count}次)`);
          
          // 收集该重复单词的所有位置信息
          const wordPositions = wordsWithPositions.filter(wd => wd.word === word);
          duplicateWordsWithPositions.push({
            word: word,
            count: count,
            positions: wordPositions
          });
        }
      }
      
      // 6. 存储结果并显示
      window.duplicateCheckResult = {
        duplicateWords: duplicateWords,
        duplicateWordsWithPositions: duplicateWordsWithPositions,
        totalWordsChecked: wordsWithPositions.length,
        allMainWords: allMainWords
      };
      
      // 7. 显示检查结果
      this.showDuplicateCheckModal();
      
      // 8. 控制台输出
      if (duplicateWords.length > 0) {
        console.warn(`检测到重复单词: ${duplicateWords.join(', ')}`);
      } else {
        console.log('✅ 未检测到重复单词');
      }
      
      return duplicateWords;
      
    } catch (error) {
      console.error('检查重复单词时出错:', error);
      return [];
    }
  }
  
  // 显示重复单词检查结果模态框
  showDuplicateCheckModal() {
    const modal = document.getElementById('duplicate-check-modal');
    const content = document.getElementById('duplicate-result-content');
    
    if (!modal || !content) {
      console.error('重复单词检查模态框元素未找到');
      return;
    }
    
    const result = window.duplicateCheckResult;
    
    if (!result) {
      content.innerHTML = '<p>没有检查结果</p>';
      return;
    }
    
    let html = '';
    
    // 检查总结
    html += `<div class="duplicate-summary">`;
    html += `<p><strong>检查统计：</strong></p>`;
    html += `<ul>`;
    html += `<li>主要单词数量：${result.allMainWords.length}</li>`;
    html += `<li>网格中检测的单词数量：${result.totalWordsChecked}</li>`;
    html += `<li>发现重复单词：${result.duplicateWords.length}</li>`;
    html += `</ul>`;
    html += `</div>`;
    
    if (result.duplicateWords.length > 0) {
      // 显示重复单词
      html += `<div class="duplicate-details">`;
      html += `<h4>⚠️ 检测到的重复单词：</h4>`;
      html += `<div class="duplicate-words-grid">`;
      
      result.duplicateWordsWithPositions.forEach(duplicateInfo => {
        html += `<div class="duplicate-word-card">`;
        html += `<div class="duplicate-word-header">`;
        html += `<span class="word-name">${duplicateInfo.word}</span>`;
        html += `<span class="word-count">${duplicateInfo.count}次</span>`;
        html += `</div>`;
        html += `<div class="duplicate-positions">`;
        
        duplicateInfo.positions.forEach((posData, index) => {
          const startPos = posData.positions[0];
          const endPos = posData.positions[posData.positions.length - 1];
          const directionName = this.getDirectionName(posData.direction);
          
          html += `<div class="position-item" data-word="${duplicateInfo.word}" data-positions='${JSON.stringify(posData.positions)}'>`;
          html += `位置${index + 1}: ${directionName} (${startPos.row},${startPos.col}-${endPos.row},${endPos.col})`;
          html += `</div>`;
        });
        
        html += `</div>`;
        html += `</div>`;
      });
      
      html += `</div>`;
      html += `</div>`;
    } else {
      // 无重复单词
      html += `<div class="no-duplicates">`;
      html += `<h4>✅ 检查结果</h4>`;
      html += `<p>恭喜！未检测到重复单词。</p>`;
      html += `<p>所有单词在网格中都是唯一的。</p>`;
      html += `</div>`;
    }
    
    content.innerHTML = html;
    
    // 绑定位置点击事件，高亮显示单词位置
    const positionItems = content.querySelectorAll('.position-item');
    positionItems.forEach(item => {
      item.addEventListener('click', () => {
        const positions = JSON.parse(item.dataset.positions);
        const word = item.dataset.word;
        
        // 清除之前的高亮
        document.querySelectorAll('.duplicate-word-highlight').forEach(cell => {
          cell.classList.remove('duplicate-word-highlight');
        });
        
        // 高亮当前单词位置
        positions.forEach(pos => {
          const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
          if (cell) {
            cell.classList.add('duplicate-word-highlight');
          }
        });
        
        // 关闭模态框
        this.closeDuplicateCheckModal();
        
        // 显示状态消息
        if (window.showStatusMessage) {
          window.showStatusMessage(`已高亮显示重复单词: ${word}`, 'info', 5000);
        }
      });
    });
    
    // 显示模态框
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  // 关闭重复单词检查模态框
  closeDuplicateCheckModal() {
    const modal = document.getElementById('duplicate-check-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }
  
  // 初始化手动刷新奖励单词按钮
  initRefreshBonusButton() {
    const refreshBtn = document.getElementById('refresh-bonus-words');
    if (!refreshBtn) {
      console.error('找不到刷新奖励单词按钮');
      return;
    }
    
    refreshBtn.addEventListener('click', () => {
      console.log('手动刷新奖励单词按钮被点击');
      
      // 显示加载状态
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = '🔄 检测中...';
      refreshBtn.disabled = true;
      
      // 执行奖励单词检测
      setTimeout(() => {
        try {
          this.detectBonusWords();
          showStatusMessage('奖励单词检测完成', 'success');
        } catch (error) {
          console.error('奖励单词检测失败:', error);
          showStatusMessage('奖励单词检测失败', 'error');
        } finally {
          // 恢复按钮状态
          refreshBtn.textContent = originalText;
          refreshBtn.disabled = false;
        }
      }, 100);
    });
    
    console.log('手动刷新奖励单词按钮初始化完成');
  }
  
  // 初始化重复单词检查模态框
  initDuplicateCheckModal() {
    const modal = document.getElementById('duplicate-check-modal');
    const closeBtn = modal?.querySelector('.close-modal');
    
    if (!modal || !closeBtn) {
      console.error('重复单词检查模态框元素未找到');
      return;
    }
    
    // 绑定关闭模态框事件
    closeBtn.addEventListener('click', () => {
      this.closeDuplicateCheckModal();
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeDuplicateCheckModal();
      }
    });
    
    console.log('重复单词检查模态框初始化完成');
  }
  
  // 初始化奖励单词模态框
  initBonusWordsModal(bonusWordsWithPositions) {
    const modal = document.getElementById('bonus-words-modal');
    const bonusList = document.getElementById('bonus-words');
    const closeBtn = document.getElementById('bonus-words-modal-close'); // 使用特定ID查找关闭按钮
    const viewBonusBtn = document.getElementById('view-bonus-words');
    
    if (!modal || !bonusList || !closeBtn || !viewBonusBtn) {
      console.error('找不到奖励单词模态框所需的DOM元素', {
        modal: !!modal,
        bonusList: !!bonusList, 
        closeBtn: !!closeBtn,
        viewBonusBtn: !!viewBonusBtn
      });
      return;
    }
    
    // 只有在第一次调用时绑定事件
    if (!this.modalInitialized) {
      console.log('初始化奖励单词模态框');
      
      // 绑定打开模态框事件
      viewBonusBtn.addEventListener('click', () => {
        console.log('查看奖励单词按钮被点击');
        
        // 每次打开前预填充奖励单词列表
        this.prefillBonusWordsModal();
        
        // 显示模态框
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
      });
      
      // 绑定关闭模态框事件
      closeBtn.addEventListener('click', (e) => {
        console.log('奖励单词模态框关闭按钮被点击');
        e.preventDefault();
        e.stopPropagation();
        this.closeBonusWordsModal();
      });
      
      // 点击模态框外部关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeBonusWordsModal();
        }
      });
      

      
      this.modalInitialized = true;
      console.log('奖励单词模态框初始化完成');
    }
  }
  
  // 填充奖励单词列表
  populateBonusWordsList(bonusWordsWithPositions) {
    try {
      const bonusList = document.getElementById('bonus-words');
      if (!bonusList) {
        console.error('无法找到bonus-words元素');
        return;
      }
      
      console.log(`准备填充 ${bonusWordsWithPositions ? bonusWordsWithPositions.length : 0} 个奖励单词到列表`);
      
      // 清空列表
      bonusList.innerHTML = '';
      
      // 检查是否有奖励单词
      if (!bonusWordsWithPositions || !Array.isArray(bonusWordsWithPositions) || bonusWordsWithPositions.length === 0) {
        console.log('没有奖励单词可显示');
        bonusList.innerHTML = '<li style="grid-column: 1/-1;">无奖励单词</li>';
        return;
      }
      
      // 添加总数显示
      const countSpan = document.createElement('div');
      countSpan.className = 'bonus-word-count';
      countSpan.textContent = `共 ${bonusWordsWithPositions.length} 个奖励单词`;
      bonusList.appendChild(countSpan);
      
      // 添加每个奖励单词
      bonusWordsWithPositions.forEach((wordData, index) => {
        if (!wordData || typeof wordData !== 'object' || !wordData.word) {
          console.warn(`忽略无效的奖励单词数据，索引: ${index}`);
          return;
        }
        
        // 创建列表项
        const li = document.createElement('li');
        li.className = 'bonus-word-item';
        
        // 显示单词文本
        const wordText = typeof wordData.word === 'string' ? wordData.word : 
                        (typeof wordData.word === 'object' && wordData.word !== null && wordData.word.word ? 
                         wordData.word.word : String(wordData.word));
        
        // 如果有位置信息，显示更多详情
        if (wordData.positions && Array.isArray(wordData.positions) && wordData.positions.length > 0) {
          const startPos = wordData.positions[0];
          const endPos = wordData.positions[wordData.positions.length - 1];
          const directionName = this.getDirectionName(wordData.direction || 'horizontal');
          
          li.textContent = `${wordText} (${directionName}, ${startPos.row},${startPos.col}-${endPos.row},${endPos.col})`;
          
          // 添加点击高亮此单词的功能
          li.addEventListener('click', () => {
            // 关闭模态框
            this.closeBonusWordsModal();
            
            // 取消当前所有高亮
            document.querySelectorAll('.bonus-word-highlight').forEach(cell => {
              cell.classList.remove('bonus-word-highlight');
            });
            
            // 高亮这个单词
            wordData.positions.forEach(pos => {
              const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
              if (cell) {
                cell.classList.add('bonus-word-highlight');
                cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
            
            showStatusMessage(`已高亮显示奖励单词: ${wordText}`);
          });
        } else {
          // 无位置信息，只显示单词文本
          li.textContent = wordText;
          li.className += ' bonus-word-without-position';
        }
        
        bonusList.appendChild(li);
      });
      
      console.log(`已填充 ${bonusWordsWithPositions.length} 个奖励单词到模态框`);
    } catch (error) {
      console.error('填充奖励单词列表时出错:', error);
      const bonusList = document.getElementById('bonus-words');
      if (bonusList) {
        bonusList.innerHTML = '<li style="grid-column: 1/-1; color: red;">加载奖励单词时出错</li>';
      }
    }
  }
  
  // 关闭奖励单词模态框
  closeBonusWordsModal() {
    console.log('正在关闭奖励单词模态框');
    const modal = document.getElementById('bonus-words-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // 恢复背景滚动
      console.log('奖励单词模态框已关闭');
    } else {
      console.error('找不到奖励单词模态框元素');
    }
  }
  
  // 添加奖励单词高亮样式
  addBonusWordStyles() {
    // 如果样式已存在则不重复添加
    if (document.getElementById('bonus-word-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'bonus-word-styles';
    style.textContent = `
      .bonus-word-highlight {
        animation: bonus-word-pulse 1.5s infinite;
        box-shadow: 0 0 5px #ffcc00;
        z-index: 1;
      }
      
      @keyframes bonus-word-pulse {
        0% { box-shadow: 0 0 5px #ffcc00; }
        50% { box-shadow: 0 0 15px #ffaa00; }
        100% { box-shadow: 0 0 5px #ffcc00; }
      }
      
      .action-btn.disabled {
        background-color: #bdc3c7;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  // 自动填充空白格子（优化后的动画版本）
  fillEmptySpaces() {
    // 确认是否继续
    if (!confirm('确定要自动填充空白格子吗？这将删除所有非拖拽单词的字母和自动填充的字母，并重新填充所有空白处。此操作无法撤销。')) {
      return;
    }
    
    // 禁用自动填充按钮，防止重复点击
    const autoFillButton = document.getElementById('auto-fill');
    if (autoFillButton) {
      autoFillButton.disabled = true;
      autoFillButton.textContent = '填充中...';
    }
    
    // 步骤1: 只保留拖拽单词，清除其他所有内容
    const draggedWords = [];
    const nonDraggedWords = [];
    
    // 分离拖拽单词和非拖拽单词
    for (const wordData of this.placedWords) {
      if (wordData.isDragged) {
        draggedWords.push(wordData);
      } else {
        nonDraggedWords.push(wordData);
      }
    }
    
    // 记录已放置单词的位置，包括交叉点
    const positionsToKeep = new Set();
    for (const { positions } of draggedWords) {
      for (const { row, col } of positions) {
        positionsToKeep.add(`${row},${col}`);
      }
    }
    
    // 首先清空非拖拽单词的位置
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        // 跳过需要保留的位置（拖拽单词的位置）
        if (positionsToKeep.has(`${row},${col}`)) continue;
        
        this.letters[row][col] = '';
        const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.textContent = '';
          cell.classList.remove('placed', 'manual', 'intersection');
          cell.style.backgroundColor = '';
          cell.style.background = '';
          cell.style.borderColor = '';
          cell.style.color = '';
        }
      }
    }
    
    // 更新已放置单词列表，只保留拖拽单词
    this.placedWords = draggedWords;
    
    // 如果有非拖拽单词，显示移除消息
    if (nonDraggedWords.length > 0) {
      showStatusMessage(`已移除 ${nonDraggedWords.length} 个非拖拽单词`);
    }
    
    // 重新放置所有拖拽单词
    for (const wordData of draggedWords) {
      const { word, positions, direction, color } = wordData;
      
      // 将每个字母放回网格
      for (let i = 0; i < positions.length; i++) {
        const { row, col } = positions[i];
        this.letters[row][col] = word[i];
        this.updateCell(row, col, word[i], color);
      }
    }
    
    // 更新UI
    this.updatePlacedWordsList();
    
    // 步骤2: 获取所有空白格子的位置
    const emptyPositions = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (!this.letters[row][col]) {
          emptyPositions.push({ row, col });
        }
      }
    }
    
    // 如果没有空白格子，直接返回
    if (emptyPositions.length === 0) {
      if (autoFillButton) {
        autoFillButton.disabled = false;
        autoFillButton.textContent = '自动填充';
      }
      showStatusMessage('没有空白格子需要填充');
      return;
    }
    
    // 收集所有单词和字母频率信息
    const allWordsData = this.collectAllWords();
    
    // 显示进度提示
    showStatusMessage(`开始填充 ${emptyPositions.length} 个空白格子...`);
    
    // 随机排序空白位置，避免填充顺序过于规则
    emptyPositions.sort(() => Math.random() - 0.5);
    
    // 计算当前网格中的字母分布情况（包括拖拽单词中的字母）
    const currentGridLetterDistribution = {};
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const letter = this.letters[row][col];
        if (letter && /^[A-Z]$/.test(letter)) {
          currentGridLetterDistribution[letter] = (currentGridLetterDistribution[letter] || 0) + 1;
        }
      }
    }
    
    console.log('现有字母分布:', currentGridLetterDistribution);
    
    // 字母频率理想比例（基于英语字母频率）
    const idealLetterRatio = {
      'E': 12.02, 'T': 9.10, 'A': 8.12, 'O': 7.68, 'I': 7.31, 'N': 6.95, 'S': 6.28, 'R': 6.02, 'H': 5.92, 'D': 4.32, 'L': 3.98,
      'U': 2.88, 'C': 2.71, 'M': 2.61, 'F': 2.30, 'Y': 2.11, 'W': 2.09, 'G': 2.03, 'P': 1.82, 'B': 1.49,
      'V': 1.11, 'K': 0.69, 'X': 0.17, 'Q': 0.11, 'J': 0.10, 'Z': 0.07
    };
    
    // 统计字母分布情况
    const letterDistribution = {};
    
    // 逐个填充空白格子，使用动画效果
    let filledCount = 0;
    const fillNextCell = () => {
      if (filledCount >= emptyPositions.length) {
        // 填充完成，恢复按钮状态
        if (autoFillButton) {
          autoFillButton.disabled = false;
          autoFillButton.textContent = '自动填充';
        }
        
        // 输出字母分布统计
        console.log('字母分布统计:', letterDistribution);
        
        // 格式化字母分布信息
        let distributionText = '字母分布: ';
        for (const letter in letterDistribution) {
          distributionText += `${letter}(${letterDistribution[letter]}) `;
        }
        
        showStatusMessage(`已自动填充 ${emptyPositions.length} 个空白格子。${distributionText}`);
        
        // 触发网格变化事件
        this.triggerGridChangeEvent();
        
        // 填充完成后检测并显示bonus word
        setTimeout(()=>{ this.detectBonusWords(); }, 800);
        
        return;
      }
      
      const pos = emptyPositions[filledCount];
      let letter = this.selectLetterForPosition(pos, allWordsData);
      
      // 全局字母平衡机制
      // 计算当前已填充字母的总数
      const totalFilledLetters = Object.values(letterDistribution).reduce((sum, count) => sum + count, 0) + 
                                Object.values(currentGridLetterDistribution).reduce((sum, count) => sum + count, 0);
      
      // 如果某个字母已经超过了理想分布的1.5倍，尝试选择另一个字母
      if (totalFilledLetters > 10) { // 只在填充了一定数量的字母后开始平衡
        const combinedCount = (letterDistribution[letter] || 0) + (currentGridLetterDistribution[letter] || 0);
        const expectedCount = totalFilledLetters * (idealLetterRatio[letter] || 1) / 100;
        
        // 如果字母出现频率已经超过预期的1.5倍，尝试重新选择
        if (combinedCount > expectedCount * 1.5 && Math.random() < 0.7) {
          console.log(`字母 ${letter} 出现过多 (${combinedCount} vs 预期 ${expectedCount.toFixed(1)})，重新选择`);
          
          // 尝试最多3次重新选择
          for (let i = 0; i < 3; i++) {
            const newLetter = this.selectLetterForPosition(pos, allWordsData);
            const newCombinedCount = (letterDistribution[newLetter] || 0) + (currentGridLetterDistribution[newLetter] || 0);
            const newExpectedCount = totalFilledLetters * (idealLetterRatio[newLetter] || 1) / 100;
            
            // 如果新字母的分布更合理，则使用新字母
            if (newCombinedCount <= newExpectedCount * 1.5) {
              letter = newLetter;
              console.log(`重新选择了字母: ${letter}`);
              break;
            }
          }
        }
      }
      
      // 更新字母分布统计
      letterDistribution[letter] = (letterDistribution[letter] || 0) + 1;
      
      // 高亮显示当前填充的单元格
      const cell = this.gridElement.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
      if (cell) {
        cell.classList.add('filling');
        
        // 短暂延迟后填充字母并移除高亮
        setTimeout(() => {
          this.updateManualCell(pos.row, pos.col, letter);
          cell.classList.remove('filling');
          
          // 更新进度
          filledCount++;
          if (filledCount % 10 === 0 || filledCount === emptyPositions.length) {
            showStatusMessage(`正在填充... (${filledCount}/${emptyPositions.length})`);
          }
          
          // 继续填充下一个单元格
          setTimeout(fillNextCell, 10); // 填充间隔时间
        }, 50); // 高亮显示时间
      } else {
        // 如果找不到单元格，直接填充并继续
        this.updateManualCell(pos.row, pos.col, letter);
        
        // 更新字母分布统计
        letterDistribution[letter] = (letterDistribution[letter] || 0) + 1;
        
        filledCount++;
        setTimeout(fillNextCell, 10);
      }
    };
    
    // 开始填充过程
    fillNextCell();
  }
  
  // 收集所有已放置单词和单词列表中的单词
  collectAllWords() {
    // 已放置的单词
    const placedWords = this.placedWords.map(wordData => wordData.word);
    
    // 单词列表中的单词（如果可用）
    let wordListWords = [];
    if (window.wordListInstance && window.wordListInstance.words) {
      wordListWords = window.wordListInstance.words;
    }
    
    // 收集字母频率信息
    const letterFrequency = {};
    const allWords = [...placedWords, ...wordListWords];
    
    // 计算字母频率
    for (const word of allWords) {
      for (const letter of word.toUpperCase()) {
        if (/^[A-Z]$/.test(letter)) {
          letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        }
      }
    }
    
    // 记录字母频率以供调试
    console.log('字母频率统计:', letterFrequency);
    
    // 返回单词列表和字母频率信息
    return {
      words: [...new Set(allWords)],
      letterFrequency: letterFrequency
    };
  }
  
  // 为特定位置选择最合适的字母
  selectLetterForPosition(position, allWordsData) {
    const { row, col } = position;
    
    // 从allWordsData中提取信息
    const allWords = allWordsData.words;
    const letterFrequencyFromWords = allWordsData.letterFrequency || {};
    
    // 2. 获取附近网格中的字母
    const surroundingLetters = this.getSurroundingLetters(row, col);
    
    // 提取周围已有的字母值，避免过度重复
    const surroundingLetterValues = surroundingLetters.map(item => item.letter);
    const surroundingLetterCounts = {};
    surroundingLetterValues.forEach(letter => {
      surroundingLetterCounts[letter] = (surroundingLetterCounts[letter] || 0) + 1;
    });
    
    // 检查周围是否有过度重复的字母（如果某个字母出现超过2次，则降低其权重）
    for (const letter in surroundingLetterCounts) {
      if (surroundingLetterCounts[letter] > 2) {
        // 如果周围已经有3个或以上相同字母，降低其被选中的可能性
        surroundingLetters.forEach(item => {
          if (item.letter === letter) {
            item.weight *= 0.3; // 大幅降低权重
          }
        });
      }
    }
    
    // 每个优先级可能选择的字母池
    let selectedLetter = null;
    const weightedOptions = [];
    
    // 优先级1: 使用空白位置附近的单词中出现的字母（但避免过度重复）
    if (surroundingLetters.length > 0) {
      const nearbyLetterOptions = [];
      
      for (const item of surroundingLetters) {
        // 避免选择周围已经重复过多的字母
        if (surroundingLetterCounts[item.letter] > 3) continue;
        
        nearbyLetterOptions.push({
          letter: item.letter,
          weight: item.weight * (1 + Math.random() * 0.5) // 添加随机性权重
        });
      }
      
      if (nearbyLetterOptions.length > 0) {
        // 60%的几率从附近字母中选择
        if (Math.random() < 0.6) {
          selectedLetter = this.weightedRandomChoice(nearbyLetterOptions);
          return selectedLetter;
        } else {
          // 将这些选项添加到总权重选项中，但保持较高权重
          nearbyLetterOptions.forEach(option => {
            weightedOptions.push({
              letter: option.letter,
              weight: option.weight * 5 // 保持高权重
            });
          });
        }
      }
    }
    
    // 优先级2: 使用单词列表中出现的字母
    if (Object.keys(letterFrequencyFromWords).length > 0) {
      const wordListLetterOptions = [];
      
      for (const [letter, frequency] of Object.entries(letterFrequencyFromWords)) {
        // 避免选择周围已经重复过多的字母
        if (surroundingLetterCounts[letter] > 2) continue;
        
        wordListLetterOptions.push({
          letter: letter,
          weight: Math.min(frequency, 5) * (1 + Math.random() * 0.3) // 基于频率的权重，上限为5，添加随机性
        });
      }
      
      if (wordListLetterOptions.length > 0) {
        // 30%的几率直接从单词列表中选择
        if (Math.random() < 0.3 && selectedLetter === null) {
          selectedLetter = this.weightedRandomChoice(wordListLetterOptions);
          return selectedLetter;
        } else {
          // 将这些选项添加到总权重选项中
          wordListLetterOptions.forEach(option => {
            weightedOptions.push({
              letter: option.letter,
              weight: option.weight * 3 // 保持中等权重
            });
          });
        }
      }
    }
    
    // 优先级3-5: 常见字母、其他字母和低频字母
    // 定义字母频率组
    const highFrequencyLetters = ['E', 'T', 'A', 'O', 'I', 'N', 'S', 'H', 'R', 'D', 'L'];
    const mediumFrequencyLetters = ['U', 'C', 'M', 'W', 'F', 'G', 'Y', 'P', 'B'];
    const lowFrequencyLetters = ['V', 'K', 'J', 'X', 'Q', 'Z'];
    
    // 添加常见字母(优先级3)
    for (const letter of highFrequencyLetters) {
      // 避免重复过多
      if (surroundingLetterCounts[letter] > 2) continue;
      
      // 计算最终权重：基础权重 + 随机性 - 周围重复度降权
      const repetitionPenalty = surroundingLetterCounts[letter] ? surroundingLetterCounts[letter] * 0.5 : 0;
      const finalWeight = Math.max(0.5, 4 + Math.random() - repetitionPenalty);
      
      weightedOptions.push({
        letter: letter,
        weight: finalWeight
      });
    }
    
    // 添加中频字母(优先级4)
    for (const letter of mediumFrequencyLetters) {
      // 避免重复过多
      if (surroundingLetterCounts[letter] > 2) continue;
      
      // 计算最终权重
      const repetitionPenalty = surroundingLetterCounts[letter] ? surroundingLetterCounts[letter] * 0.5 : 0;
      const finalWeight = Math.max(0.3, 2 + Math.random() - repetitionPenalty);
      
      weightedOptions.push({
        letter: letter,
        weight: finalWeight
      });
    }
    
    // 添加低频字母(优先级5)
    for (const letter of lowFrequencyLetters) {
      // 避免重复过多
      if (surroundingLetterCounts[letter] > 1) continue; // 低频字母重复限制更严格
      
      // 计算最终权重
      const finalWeight = 0.5 + Math.random() * 0.5; // 低频字母权重低，但有一定随机性
      
      weightedOptions.push({
        letter: letter,
        weight: finalWeight
      });
    }
    
    // 从所有加权选项中选择
    if (weightedOptions.length > 0) {
      return this.weightedRandomChoice(weightedOptions);
    }
    
    // 最后的备选：随机选择一个不常见的字母
    const randomIndex = Math.floor(Math.random() * 26);
    return "ETAOINSRHDLUCMWFGYPBVKJXQZ"[randomIndex];
  }
  
  // 获取附近网格中的字母（优化版本）
  getSurroundingLetters(row, col) {
    const surroundingLetters = [];
    
    // 检查周围8个方向的单元格，优先考虑直接相邻的单元格
    const directions = [
      // 相邻单元格 - 较高权重（距离 1）
      { dRow: -1, dCol: 0, weight: 1.5 },  // 上
      { dRow: 1, dCol: 0, weight: 1.5 },   // 下
      { dRow: 0, dCol: -1, weight: 1.5 },  // 左
      { dRow: 0, dCol: 1, weight: 1.5 },   // 右
      { dRow: -1, dCol: -1, weight: 1.2 }, // 左上
      { dRow: -1, dCol: 1, weight: 1.2 },  // 右上
      { dRow: 1, dCol: -1, weight: 1.2 },  // 左下
      { dRow: 1, dCol: 1, weight: 1.2 },   // 右下
      
      // 距离 2 的单元格 - 较低权重
      { dRow: -2, dCol: 0, weight: 0.7 },  // 上上
      { dRow: 2, dCol: 0, weight: 0.7 },   // 下下
      { dRow: 0, dCol: -2, weight: 0.7 },  // 左左
      { dRow: 0, dCol: 2, weight: 0.7 },   // 右右
      { dRow: -2, dCol: -2, weight: 0.5 }, // 左上远
      { dRow: -2, dCol: 2, weight: 0.5 },  // 右上远
      { dRow: 2, dCol: -2, weight: 0.5 },  // 左下远
      { dRow: 2, dCol: 2, weight: 0.5 }    // 右下远
    ];
    
    // 检查每个方向
    for (const direction of directions) {
      const newRow = row + direction.dRow;
      const newCol = col + direction.dCol;
      
      // 检查边界
      if (newRow >= 0 && newRow < this.height && newCol >= 0 && newCol < this.width) {
        const letter = this.letters[newRow][newCol];
        if (letter) {
          surroundingLetters.push({
            letter: letter,
            weight: direction.weight,
            distance: Math.sqrt(direction.dRow * direction.dRow + direction.dCol * direction.dCol)
          });
        }
      }
    }
    
    return surroundingLetters;
  }
  
  // 根据权重随机选择一个字母
  weightedRandomChoice(weightedLetters) {
    if (weightedLetters.length === 0) {
      return 'E'; // 默认返回最常见的字母
    }
    
    // 计算总权重
    const totalWeight = weightedLetters.reduce((sum, item) => sum + item.weight, 0);
    
    // 随机选择一个权重点
    let randomWeight = Math.random() * totalWeight;
    let runningWeight = 0;
    
    // 找到对应的字母
    for (const item of weightedLetters) {
      runningWeight += item.weight;
      if (randomWeight <= runningWeight) {
        return item.letter;
      }
    }
    
    // 默认返回第一个字母（通常不会走到这里）
    return weightedLetters[0].letter;
  }

  // 触发网格变化事件
  triggerGridChangeEvent() {
    // 创建自定义事件，用于通知其他组件（如WordList）
    const event = new CustomEvent('wordGridChanged', {
      detail: {
        placedWords: this.placedWords.map(w => w.word)
      }
    });
    document.dispatchEvent(event);
  }

  // 初始化预览功能
  initPreview() {
    console.log('开始初始化预览功能...');
    const previewButton = document.getElementById('preview-level');
    console.log('预览按钮:', previewButton);
    
    const previewPage = document.getElementById('preview-page');
    console.log('预览页面元素:', previewPage);
    
    if (!previewButton || !previewPage) {
      console.error('预览功能初始化失败：找不到预览按钮或预览页面元素');
      return;
    }
    
    // 绑定预览按钮点击事件
    console.log('正在绑定预览按钮点击事件...');
    previewButton.addEventListener('click', () => {
      console.log('预览按钮被点击');
      this.showPreview();
    });
    
    // 绑定保存预览图片按钮事件
    const saveImageBtn = document.getElementById('save-preview-image');
    console.log('保存图片按钮:', saveImageBtn);
    if (saveImageBtn) {
      saveImageBtn.addEventListener('click', () => {
        console.log('保存图片按钮被点击');
        this.savePreviewAsImage();
      });
    }
    
    // 绑定返回按钮事件
    const backButton = document.getElementById('back-to-editor');
    console.log('返回按钮:', backButton);
    if (backButton) {
      backButton.addEventListener('click', () => {
        console.log('返回按钮被点击');
        // 隐藏预览页面，显示编辑器页面
        previewPage.classList.remove('active');
        document.getElementById('editor-page').classList.add('active');
      });
    }
    
    console.log('预览功能初始化完成');
  }

  // 保存预览为图片
  savePreviewAsImage() {
    // 检查是否支持electronAPI
    if (!window.electronAPI || typeof window.electronAPI.saveImage !== 'function') {
      // 如果不支持electronAPI的saveImage方法，使用下载方式保存
      this.downloadPreviewAsImage();
      return;
    }
    
    const captureArea = document.getElementById('preview-capture');
    if (!captureArea) {
      showStatusMessage('保存图片失败：找不到截图区域', 'error');
      return;
    }
    
    // 显示加载中提示
    showStatusMessage('正在生成预览图片...', 'success');
    
    // 引入html2canvas库（如果未预先加载）
    if (typeof html2canvas !== 'function') {
      // 创建script标签，加载html2canvas库
      const script = document.createElement('script');
      script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
      script.onload = () => {
        // 脚本加载完成后，调用截图函数
        this.captureAndSaveImage(captureArea);
      };
      script.onerror = () => {
        showStatusMessage('加载截图库失败，请检查网络连接', 'error');
      };
      document.head.appendChild(script);
    } else {
      // 如果已加载，直接调用截图函数
      this.captureAndSaveImage(captureArea);
    }
  }

  // 下载预览图片（浏览器方式）
  downloadPreviewAsImage() {
    const captureArea = document.getElementById('preview-capture');
    if (!captureArea) {
      showStatusMessage('保存图片失败：找不到截图区域', 'error');
      return;
    }
    
    // 显示加载中提示
    showStatusMessage('正在生成预览图片...', 'success');
    
    // 引入html2canvas库（如果未预先加载）
    if (typeof html2canvas !== 'function') {
      // 创建script标签，加载html2canvas库
      const script = document.createElement('script');
      script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
      script.onload = () => {
        // 脚本加载完成后，调用截图函数
        this.captureAndDownloadImage(captureArea);
      };
      script.onerror = () => {
        showStatusMessage('加载截图库失败，请检查网络连接', 'error');
      };
      document.head.appendChild(script);
    } else {
      // 如果已加载，直接调用截图函数
      this.captureAndDownloadImage(captureArea);
    }
  }

  // 截图并保存图片（Electron方式）
  captureAndSaveImage(element) {
    html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 2倍清晰度
      logging: false,
      useCORS: true
    }).then(canvas => {
      // 转换为图片数据
      const imageData = canvas.toDataURL('image/png');
      
      // 获取关卡标题，用作文件名
      const title = document.getElementById('preview-title').textContent || '关卡预览';
      const fileName = `${title.replace(/[\/\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0,10)}.png`;
      
      // 通过Electron API保存图片
      window.electronAPI.saveImage({ imageData, fileName })
        .then(result => {
          if (result.success) {
            showStatusMessage(`预览图片已保存为: ${result.filePath}`, 'success');
          } else {
            showStatusMessage(`保存失败: ${result.error}`, 'error');
          }
        })
        .catch(err => {
          console.error('保存图片时出错:', err);
          showStatusMessage('保存图片失败', 'error');
        });
    }).catch(error => {
      console.error('截图时出错:', error);
      showStatusMessage('生成截图失败', 'error');
    });
  }

  // 截图并下载图片（浏览器方式）
  captureAndDownloadImage(element) {
    html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 2倍清晰度
      logging: false,
      useCORS: true
    }).then(canvas => {
      // 转换为图片数据
      const imageData = canvas.toDataURL('image/png');
      
      // 获取关卡标题，用作文件名
      const title = document.getElementById('preview-title').textContent || '关卡预览';
      const fileName = `${title.replace(/[\/\\:*?"<>|]/g, '_')}_${new Date().toISOString().slice(0,10)}.png`;
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = imageData;
      link.download = fileName;
      
      // 模拟点击下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatusMessage('预览图片已下载', 'success');
    }).catch(error => {
      console.error('截图时出错:', error);
      showStatusMessage('生成截图失败', 'error');
    });
  }

  // 显示预览界面
  showPreview() {
    // 彻底移除所有旧的连线SVG容器，防止残留
    document.querySelectorAll('.word-lines-container, #preview-word-lines, #single-wordset-preview-lines').forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    console.log('显示预览...');
    const previewPage = document.getElementById('preview-page');
    const previewGrid = document.getElementById('preview-grid');
    const previewWordList = document.getElementById('preview-word-list');
    const previewTitle = document.getElementById('preview-title');
    
    if (!previewPage || !previewGrid || !previewWordList) {
      console.error('找不到预览页面所需的DOM元素');
      return;
    }
    
    // 0. 清除之前的预览内容
    previewGrid.innerHTML = '';
    previewWordList.innerHTML = '';
    
    // 1. 设置关卡标题
    const displayTitle = this.title || 'Word Search 关卡';
    previewTitle.textContent = displayTitle;
    console.log(`设置预览标题: ${displayTitle}`);
    
    // 2. 保存当前网格数据用于导出
    this.previewData = this.getGridData();
    console.log('已保存网格数据用于导出:', this.previewData);
    
    // 3. 设置预览网格大小
    console.log(`设置网格大小: ${this.width}x${this.height}`);
    previewGrid.style.gridTemplateColumns = `repeat(${this.width}, 1fr)`;
    
    // 4. 填充网格
    const gridCells = [];
    for (let row = 0; row < this.height; row++) {
      const rowCells = [];
      for (let col = 0; col < this.width; col++) {
        const cell = document.createElement('div');
        cell.className = 'preview-grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // 填充字母或星号
        // 获取当前单元格的字母
        const letter = this.letters[row][col] || '';
        
        // 如果是空字母，用星号代替
        if (!letter || letter.trim() === '') {
          cell.textContent = '*';
          cell.style.color = '#888'; // 灰色星号
        } else {
          cell.textContent = letter;
        }
        
        previewGrid.appendChild(cell);
        rowCells.push(cell);
      }
      gridCells.push(rowCells);
    }
    console.log(`创建了 ${this.width * this.height} 个网格单元格`);
    
    // 5. 添加单词列表
    // 根据拖拽单词和已放置单词生成列表
    const draggedWords = this.placedWords.filter(wordData => wordData.isDragged);
    console.log(`找到 ${draggedWords.length} 个已放置的单词`);
    
    // 如果没有拖拽单词，显示警告
    if (draggedWords.length === 0) {
      previewWordList.innerHTML = '<div class="no-words-message">请先放置单词到网格中</div>';
      showStatusMessage('没有找到要查找的单词，请先通过拖拽放置单词', 'warning');
      console.log('没有找到可显示的单词');
    } else {
      // 创建一个对象来存储所有线条元素，方便后续引用
      const wordLineObjects = {};
      
      // 为每个单词创建标签
      console.log('开始创建单词标签和连线');
      draggedWords.forEach((wordData, index) => {
        const { word, color } = wordData;
        console.log(`处理单词: ${word}, 颜色: ${color}`);
        
        // 创建单词标签
        const wordSpan = document.createElement('div');
        wordSpan.className = 'preview-word';
        wordSpan.textContent = word;
        wordSpan.style.backgroundColor = color;
        wordSpan.dataset.word = word; // 设置data-word属性
        
        previewWordList.appendChild(wordSpan);
        
        // 绘制单词连线并获取线条元素
        console.log(`开始为单词 ${word} 绘制连线`);
        const lineObject = this.drawWordLine(wordData, previewGrid);
        if (lineObject) {
          wordLineObjects[word] = lineObject;
          console.log(`成功创建 ${word} 的连线`);
        } else {
          console.warn(`为单词 ${word} 创建连线失败`);
        }
        
        // 为单词标签添加点击事件
        wordSpan.addEventListener('click', () => {
          console.log(`单词 ${word} 被点击`);
          // 重置所有单词和线条的样式
          previewWordList.querySelectorAll('.preview-word').forEach(span => {
            span.style.transform = '';
            span.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          });
          
          // 重置所有线条
          // 注意：由于线条现在在setTimeout中创建，我们需要等待一段时间后再操作
          setTimeout(() => {
            // 重置所有连线路径
            document.querySelectorAll(".word-lines-container path").forEach(path => {
              // 获取原路径的单词属性
              const pathWord = path.getAttribute("data-word");
              // 恢复默认透明度
              if (pathWord) {
                const pathColor = this.colorMap[pathWord];
                if (pathColor) {
                  path.setAttribute("fill", this.hexToRgba(pathColor, 0.6));
                }
              }
            });
            
            // 恢复所有端点的默认透明度
            document.querySelectorAll(".word-lines-container circle").forEach(circle => {
              circle.setAttribute("opacity", "0.7");
            });
            
            // 突出显示当前选中单词的连线
            const currentPath = document.querySelector(`.word-lines-container path[data-word="${word}"]`);
            if (currentPath) {
              // 增加选中路径的不透明度
              currentPath.setAttribute("fill", this.hexToRgba(color, 0.8));
              // 确保当前路径在最上层
              const parentSvg = currentPath.parentNode;
              if (parentSvg) {
                parentSvg.appendChild(currentPath); // 移到最后，确保在顶层显示
              }
            }
            
            // 突出显示当前选中单词的端点
            document.querySelectorAll(`.word-lines-container circle[data-word="${word}"]`).forEach(circle => {
              circle.setAttribute("opacity", "0.85");
              // 确保端点在最上层
              const parentSvg = circle.parentNode;
              if (parentSvg) {
                parentSvg.appendChild(circle);
              }
            });
          }, 200);
          
          // 重置所有单元格
          previewGrid.querySelectorAll('.preview-grid-cell').forEach(cell => {
            cell.style.transform = '';
            cell.style.zIndex = '10';
            cell.style.textShadow = 'none'; // 明确设置为无阴影
            // 保持字体颜色为黑色
            cell.style.color = cell.textContent === '*' ? '#888' : '#000';
          });
          
          // 突出显示当前选中的单词
          wordSpan.style.transform = 'scale(1.1) translateY(-3px)';
          wordSpan.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
          
          // 突出显示当前单词的单元格
          const selectedCells = previewGrid.querySelectorAll(`.preview-grid-cell[data-word="${word}"]`);
          selectedCells.forEach((cell, index) => {
            // 添加缩放效果
            cell.style.transform = 'scale(1.1)';
            cell.style.zIndex = '12'; // 确保在突出显示状态下高于线条
            
            // 保持黑色字体，没有阴影
            cell.style.color = '#000000';
            cell.style.fontWeight = 'bold';
            cell.style.textShadow = 'none'; // 移除白色阴影
            cell.style.transition = 'all 0.3s ease';
            
            // 为首尾单元格添加特殊样式
            if (index === 0 || index === selectedCells.length - 1) {
              cell.style.transform = 'scale(1.2)';
              cell.style.fontWeight = 'bolder';
            }
          });
        });
      });
    }
    
    // 6. 添加特殊单词预览功能
    this.initSpecialWordsPreview(previewGrid, draggedWords);
    
    // 调试：检查draggedWords数据
    console.log('draggedWords数据:', draggedWords.map(w => ({
      word: w.word,
      isGold: w.isGold,
      isBlackDot: w.isBlackDot,
      hasPositions: !!w.positions
    })));
    
    // 7. 显示预览页面
    // 隐藏编辑器页面，显示预览页面
    console.log('切换到预览页面');
    document.getElementById('editor-page').classList.remove('active');
    previewPage.classList.add('active');
    
    console.log('预览页面已显示');
  }
  
  // 初始化特殊单词预览功能
  initSpecialWordsPreview(previewGrid, draggedWords) {
    const toggle = document.getElementById('special-words-preview');
    if (!toggle) {
      console.warn('找不到特殊单词预览开关');
      return;
    }
    
    console.log('初始化特殊单词预览功能');
    
    // 标记特殊单词位置
    const markSpecialWordPositions = () => {
      // 首先清除所有特殊图标样式
      previewGrid.querySelectorAll('.preview-grid-cell').forEach(cell => {
        cell.classList.remove('gold-icon', 'black-dot-icon');
        
        // 移除图标元素
        const goldStar = cell.querySelector('.gold-star');
        const blackDot = cell.querySelector('.black-dot');
        if (goldStar) goldStar.remove();
        if (blackDot) blackDot.remove();
        
        // 如果这个单元格原本有单词，恢复单词的原始样式
        if (cell.dataset.word) {
          cell.style.backgroundColor = 'transparent';
          cell.style.border = '';
          cell.style.borderRadius = '';
          cell.style.color = '#000';
        }
      });
      
      if (!toggle.checked) {
        console.log('特殊单词预览已关闭');
        return;
      }
      
      console.log('应用特殊单词图标...');
      console.log('draggedWords总数:', draggedWords.length);
      
      // 遍历所有拖拽的单词，找到特殊单词
      draggedWords.forEach((wordData, index) => {
        const { word, isGold, isBlackDot, positions } = wordData;
        
        console.log(`检查单词 ${index + 1}/${draggedWords.length}: ${word}`, {
          isGold,
          isBlackDot,
          hasPositions: !!positions,
          positionsCount: positions ? positions.length : 0
        });
        
        if (isGold || isBlackDot) {
          console.log(`🌟 发现特殊单词: ${word}, 金币关: ${isGold}, 圆点关: ${isBlackDot}`);
          
          // 标记该单词的所有位置
          if (positions && positions.length > 0) {
            positions.forEach((pos, posIndex) => {
              const cell = previewGrid.querySelector(
                `.preview-grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`
              );
              
              console.log(`查找单元格 (${pos.row}, ${pos.col}):`, cell ? '找到' : '未找到');
              
              if (cell) {
                if (isGold) {
                  cell.classList.add('gold-icon');
                  // 直接设置样式确保生效
                  cell.style.backgroundColor = '#FFD700';
                  cell.style.border = '3px solid #FFA500';
                  cell.style.borderRadius = '50%';
                  cell.style.color = 'transparent';
                  cell.style.position = 'relative';
                  
                  // 创建星星图标
                  if (!cell.querySelector('.gold-star')) {
                    const star = document.createElement('span');
                    star.className = 'gold-star';
                    star.textContent = '★';
                    star.style.position = 'absolute';
                    star.style.top = '50%';
                    star.style.left = '50%';
                    star.style.transform = 'translate(-50%, -50%)';
                    star.style.color = '#FFD700';
                    star.style.fontSize = '20px';
                    star.style.fontWeight = 'bold';
                    star.style.zIndex = '10';
                    star.style.pointerEvents = 'none';
                    cell.appendChild(star);
                  }
                  
                  console.log(`✅ 标记金币图标: (${pos.row}, ${pos.col})`, cell);
                  console.log('单元格类名:', cell.className);
                  console.log('直接设置后的背景色:', window.getComputedStyle(cell).backgroundColor);
                } else if (isBlackDot) {
                  cell.classList.add('black-dot-icon');
                  // 直接设置样式确保生效
                  cell.style.backgroundColor = '#333333';
                  cell.style.border = '3px solid #000000';
                  cell.style.borderRadius = '50%';
                  cell.style.color = 'transparent';
                  cell.style.position = 'relative';
                  
                  // 创建圆点图标
                  if (!cell.querySelector('.black-dot')) {
                    const dot = document.createElement('span');
                    dot.className = 'black-dot';
                    dot.textContent = '●';
                    dot.style.position = 'absolute';
                    dot.style.top = '50%';
                    dot.style.left = '50%';
                    dot.style.transform = 'translate(-50%, -50%)';
                    dot.style.color = '#000000';
                    dot.style.fontSize = '20px';
                    dot.style.fontWeight = 'bold';
                    dot.style.zIndex = '10';
                    dot.style.pointerEvents = 'none';
                    cell.appendChild(dot);
                  }
                  
                  console.log(`✅ 标记圆点图标: (${pos.row}, ${pos.col})`, cell);
                  console.log('单元格类名:', cell.className);
                }
              }
            });
          } else {
            console.warn(`❌ 特殊单词 ${word} 没有位置信息`);
          }
        }
      });
    };
    
    // 监听开关状态变化
    toggle.addEventListener('change', markSpecialWordPositions);
    
    // 初始状态处理 - 默认开启开关
    toggle.checked = true;
    markSpecialWordPositions();
    
    console.log('特殊单词预览功能初始化完成');
  }
  
  // 为导入的关卡数据初始化特殊单词预览功能
  initSpecialWordsPreviewWithData(previewGrid, wordsData, gridArr) {
    const toggle = document.getElementById('special-words-preview');
    if (!toggle) {
      console.warn('找不到特殊单词预览开关');
      return;
    }
    
    console.log('为导入数据初始化特殊单词预览功能');
    
    // 标记特殊单词位置
    const markSpecialWordPositions = () => {
      // 首先清除所有特殊图标样式
      previewGrid.querySelectorAll('.preview-grid-cell').forEach(cell => {
        cell.classList.remove('gold-icon', 'black-dot-icon');
        
        // 移除图标元素
        const goldStar = cell.querySelector('.gold-star');
        const blackDot = cell.querySelector('.black-dot');
        if (goldStar) goldStar.remove();
        if (blackDot) blackDot.remove();
        
        // 如果这个单元格原本有单词，恢复单词的原始样式
        if (cell.dataset.word) {
          cell.style.backgroundColor = 'transparent';
          cell.style.border = '';
          cell.style.borderRadius = '';
          cell.style.color = '#000';
        }
      });
      
      if (!toggle.checked) {
        console.log('特殊单词预览已关闭');
        return;
      }
      
      console.log('应用特殊单词图标...');
      
      // 遍历所有单词数据，找到特殊单词
      wordsData.forEach(wordObj => {
        const { word, isGold, isBlackDot, coins } = wordObj;
        
        // 检查是否为特殊单词（兼容coins字段）
        const isGoldWord = isGold || (coins && coins.length > 0);
        const isBlackDotWord = isBlackDot;
        
        if (isGoldWord || isBlackDotWord) {
          console.log(`处理特殊单词: ${word}, 金币关: ${isGoldWord}, 圆点关: ${isBlackDotWord}`);
          
          // 在网格中查找该单词的位置
          const foundWord = this.findWordInGrid(word, gridArr);
          
          if (foundWord.positions && foundWord.positions.length > 0) {
            foundWord.positions.forEach(pos => {
              const cell = previewGrid.querySelector(
                `.preview-grid-cell[data-row="${pos.row}"][data-col="${pos.col}"]`
              );
              
                             if (cell) {
                 if (isGoldWord) {
                   cell.classList.add('gold-icon');
                   // 直接设置样式确保生效
                   cell.style.backgroundColor = '#FFD700';
                   cell.style.border = '3px solid #FFA500';
                   cell.style.borderRadius = '50%';
                   cell.style.color = 'transparent';
                   cell.style.position = 'relative';
                   
                   // 创建星星图标
                   if (!cell.querySelector('.gold-star')) {
                     const star = document.createElement('span');
                     star.className = 'gold-star';
                     star.textContent = '★';
                     star.style.position = 'absolute';
                     star.style.top = '50%';
                     star.style.left = '50%';
                     star.style.transform = 'translate(-50%, -50%)';
                     star.style.color = '#FFD700';
                     star.style.fontSize = '20px';
                     star.style.fontWeight = 'bold';
                     star.style.zIndex = '10';
                     star.style.pointerEvents = 'none';
                     cell.appendChild(star);
                   }
                   
                   console.log(`标记金币图标: (${pos.row}, ${pos.col})`);
                 } else if (isBlackDotWord) {
                   cell.classList.add('black-dot-icon');
                   // 直接设置样式确保生效
                   cell.style.backgroundColor = '#333333';
                   cell.style.border = '3px solid #000000';
                   cell.style.borderRadius = '50%';
                   cell.style.color = 'transparent';
                   cell.style.position = 'relative';
                   
                   // 创建圆点图标
                   if (!cell.querySelector('.black-dot')) {
                     const dot = document.createElement('span');
                     dot.className = 'black-dot';
                     dot.textContent = '●';
                     dot.style.position = 'absolute';
                     dot.style.top = '50%';
                     dot.style.left = '50%';
                     dot.style.transform = 'translate(-50%, -50%)';
                     dot.style.color = '#000000';
                     dot.style.fontSize = '20px';
                     dot.style.fontWeight = 'bold';
                     dot.style.zIndex = '10';
                     dot.style.pointerEvents = 'none';
                     cell.appendChild(dot);
                   }
                   
                   console.log(`标记圆点图标: (${pos.row}, ${pos.col})`);
                 }
               }
            });
          } else {
            console.warn(`在网格中找不到单词: ${word}`);
          }
        }
      });
    };
    
    // 移除之前的事件监听器（防止重复绑定）
    const existingToggle = document.getElementById('special-words-preview');
    if (existingToggle) {
      existingToggle.removeEventListener('change', markSpecialWordPositions);
    }
    
    // 监听开关状态变化
    toggle.addEventListener('change', markSpecialWordPositions);
    
    // 初始状态处理 - 默认开启开关
    toggle.checked = true;
    markSpecialWordPositions();
    
    console.log('导入数据特殊单词预览功能初始化完成');
  }

  // 绘制单词连线
  drawWordLine(wordData, gridContainer) {
    console.log(`开始绘制连线: 单词=${wordData.word}, 颜色=${wordData.color}`);
    const { positions, color, word } = wordData;
    
    if (positions.length < 2) {
      console.warn('连线需要至少2个点');
      return null;
    }
    
    // 获取首尾单元格的位置
    const firstCell = gridContainer.querySelector(`[data-row="${positions[0].row}"][data-col="${positions[0].col}"]`);
    const lastCell = gridContainer.querySelector(`[data-row="${positions[positions.length-1].row}"][data-col="${positions[positions.length-1].col}"]`);
    
    if (!firstCell || !lastCell) {
      console.warn(`找不到单词 ${word} 的首尾单元格`);
      return null;
    }
    
    // 创建一个SVG元素作为连线容器
    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.style.position = "absolute";
    svgContainer.style.top = "0";
    svgContainer.style.left = "0";
    svgContainer.style.width = "100%";
    svgContainer.style.height = "100%";
    svgContainer.style.pointerEvents = "none";
    // 将线的层级设为5，确保它在字母之下
    svgContainer.style.zIndex = "5";
    
    // 确保SVG容器位于网格单元格上层
    svgContainer.setAttribute("class", "word-lines-container");
    
    // 获取预览网格容器
    const previewGridContainer = document.querySelector('.preview-grid-container');
    if (!previewGridContainer) {
      console.error('找不到预览网格容器');
      return null;
    }
    
    // 将SVG容器添加到网格容器
    previewGridContainer.appendChild(svgContainer);
    
    // 等待DOM完全渲染，然后获取实际的单元格尺寸和位置
    setTimeout(() => {
      // 获取网格容器的位置
      const gridRect = gridContainer.getBoundingClientRect();
      
      // 获取单元格的实际尺寸
      const firstCellRect = firstCell.getBoundingClientRect();
      const cellWidth = firstCellRect.width;
      const cellHeight = firstCellRect.height;
      
      // 计算网格间距 (gridGap)
      // 如果有两个相邻的单元格，我们可以计算它们之间的间距
      const nextCell = gridContainer.querySelector(`[data-row="${positions[0].row}"][data-col="${positions[0].col + 1}"]`);
      let gridGap = 3; // 默认值为3px，与CSS中设置的一致
      
      if (nextCell) {
        const nextCellRect = nextCell.getBoundingClientRect();
        gridGap = nextCellRect.left - (firstCellRect.left + firstCellRect.width);
      }
      
      console.log(`实际单元格尺寸: ${cellWidth}x${cellHeight}, 间距: ${gridGap}`);
      
      // 计算网格中首尾单元格的中心点位置（相对于网格容器）
      const firstRow = parseInt(firstCell.dataset.row);
      const firstCol = parseInt(firstCell.dataset.col);
      const lastRow = parseInt(lastCell.dataset.row);
      const lastCol = parseInt(lastCell.dataset.col);
      
      // 获取首尾单元格中心点的实际位置
      const firstCellCenterX = firstCell.offsetLeft + cellWidth / 2;
      const firstCellCenterY = firstCell.offsetTop + cellHeight / 2;
      const lastCellCenterX = lastCell.offsetLeft + cellWidth / 2;
      const lastCellCenterY = lastCell.offsetTop + cellHeight / 2;
      
      console.log(`计算的坐标 - 开始: (${firstCellCenterX}, ${firstCellCenterY}), 结束: (${lastCellCenterX}, ${lastCellCenterY})`);
      
      // 创建一个单一的路径而不是分离的线段和圆
      const lineWidth = 28; // 线的宽度
      const colorRgba = this.hexToRgba(color, 0.6); // 半透明颜色
      
      // 创建路径元素
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("data-word", word);
      path.style.pointerEvents = "auto";
      path.style.cursor = "pointer";
      
      // 计算路径
      // 开始移动到第一个单元格的中心
      const angle = Math.atan2(lastCellCenterY - firstCellCenterY, lastCellCenterX - firstCellCenterX);
      const halfWidth = lineWidth / 2;
      
      // 计算线条方向的垂直偏移量
      const dx = Math.sin(angle) * halfWidth;
      const dy = -Math.cos(angle) * halfWidth;
      
      // 创建直线路径，宽度为lineWidth
      // 1. 从起点半圆开始
      let pathData = `M ${firstCellCenterX + dx} ${firstCellCenterY + dy}`;
      // 2. 添加半圆弧
      pathData += ` A ${halfWidth} ${halfWidth} 0 0 0 ${firstCellCenterX - dx} ${firstCellCenterY - dy}`;
      // 3. 直线到终点半圆
      pathData += ` L ${lastCellCenterX - dx} ${lastCellCenterY - dy}`;
      // 4. 添加终点半圆弧
      pathData += ` A ${halfWidth} ${halfWidth} 0 0 0 ${lastCellCenterX + dx} ${lastCellCenterY + dy}`;
      // 5. 闭合路径
      pathData += ` Z`;
      
      path.setAttribute("d", pathData);
      path.setAttribute("fill", colorRgba);
      path.setAttribute("stroke", "none");
      
      // 将路径添加到SVG容器
      svgContainer.appendChild(path);
      
      console.log('已将SVG连线添加到预览网格容器');
      
      // 添加端点圆点以确保与字母位置完全对齐
      const createEndpoint = (centerX, centerY, isStart) => {
        const endpoint = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        endpoint.setAttribute("cx", centerX);
        endpoint.setAttribute("cy", centerY);
        endpoint.setAttribute("r", 14); // 端点半径设为28px的一半
        endpoint.setAttribute("fill", color);
        endpoint.setAttribute("opacity", "0.7");
        endpoint.setAttribute("data-word", word);
        endpoint.setAttribute("data-endpoint", isStart ? "start" : "end");
        svgContainer.appendChild(endpoint);
        return endpoint;
      };
      
      // 创建起点和终点
      const startPoint = createEndpoint(firstCellCenterX, firstCellCenterY, true);
      const endPoint = createEndpoint(lastCellCenterX, lastCellCenterY, false);
      
      // 标记单元格属于该单词
      positions.forEach((pos, index) => {
        const cell = gridContainer.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
          // 根据是否为首尾，应用不同的样式
          const isEndpoint = index === 0 || index === positions.length - 1;
          
          // 在预览模式中，不改变单元格的背景色
          cell.style.backgroundColor = 'transparent';
          
          // 设置字母在线的上层
          cell.style.position = 'relative';
          cell.style.zIndex = '10';
          
          // 保持字母为黑色，使用粗体突出显示
          cell.style.color = '#000'; // 黑色字母
          cell.style.fontWeight = 'bold';
          
          // 移除白色阴影效果
          cell.style.textShadow = 'none';
          
          if (isEndpoint) {
            cell.style.fontWeight = 'bolder';
          }
          
          cell.dataset.word = word;
          cell.dataset.position = index;
        }
      });
      
      // 为单词单元格添加鼠标悬停效果
      const wordCells = gridContainer.querySelectorAll(`[data-word="${word}"]`);
      wordCells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
          // 突出显示线条 - 略微改变不透明度
          path.setAttribute("fill", this.hexToRgba(color, 0.75));
          startPoint.setAttribute("opacity", "0.85");
          endPoint.setAttribute("opacity", "0.85");
          
          // 突出显示相关单元格
          wordCells.forEach(wordCell => {
            wordCell.style.transform = 'scale(1.1)';
            wordCell.style.zIndex = '12';
          });
        });
        
        cell.addEventListener('mouseleave', () => {
          // 恢复线条样式
          path.setAttribute("fill", colorRgba);
          startPoint.setAttribute("opacity", "0.7");
          endPoint.setAttribute("opacity", "0.7");
          
          // 恢复单元格样式
          wordCells.forEach((wordCell, i) => {
            wordCell.style.transform = '';
            wordCell.style.zIndex = '10';
          });
        });
      });
      
      // 为路径添加点击事件
      path.addEventListener('click', () => {
        console.log(`线条被点击: ${word}`);
        // 触发单词按钮的点击事件
        const wordSpan = document.querySelector(`.preview-word[data-word="${word}"]`);
        if (wordSpan) {
          wordSpan.click();
        }
      });
      
      // 为端点添加点击事件
      startPoint.addEventListener('click', () => {
        const wordSpan = document.querySelector(`.preview-word[data-word="${word}"]`);
        if (wordSpan) {
          wordSpan.click();
        }
      });
      
      endPoint.addEventListener('click', () => {
        const wordSpan = document.querySelector(`.preview-word[data-word="${word}"]`);
        if (wordSpan) {
          wordSpan.click();
        }
      });
      
    }, 100); // 设置一个短暂的延迟，确保DOM已经完全渲染
    
    console.log(`连线准备完成: ${word}`);
    return {
      svgContainer
    };
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // 初始化重置按钮功能
  initResetButton() {
    const resetButton = document.getElementById('reset-grid');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.resetGrid();
      });
    }
  }
  
  // 重置网格功能 - 清除所有单词和字母
  resetGrid(options = {}) {
    const silent = options.silent === true;
    // 显示确认对话框（仅非静默模式）
    if (!silent) {
      if (!confirm('确定要重置整个网格吗？这将清除所有已放置的单词和字母。此操作无法撤销。')) {
        return;
      }
    }
    
    // 清理WordList的拖拽状态
    if (window.wordListInstance && typeof window.wordListInstance.clearDragState === 'function') {
      window.wordListInstance.clearDragState();
    }
    // 保存当前网格尺寸
    const currentWidth = this.width;
    const currentHeight = this.height;
    // 重置内部数据
    this.letters = Array(this.height).fill().map(() => Array(this.width).fill(''));
    this.placedWords = [];
    this.colorMap = {}; // 完全清空颜色映射
    // 清空网格UI - 恢复默认样式
    this.gridElement.querySelectorAll('.grid-cell').forEach(cell => {
      // 完全重置单元格样式为默认状态
      cell.textContent = '';
      cell.className = 'grid-cell';
      cell.style.cssText = ''; // 清除所有内联样式
    });
    // 清空已放置单词列表
    document.getElementById('placed-words').innerHTML = '';
    // 如果WordList实例存在，重置其状态
    if (window.wordListInstance) {
      // 重置单词的放置状态
      window.wordListInstance.resetPlacedStatus();
    }
    // 重置奖励单词数据
    window.bonusWordsData = {
      words: [],
      wordsWithPositions: []
    };
    // 更新"查看奖励单词"按钮状态
    const viewBonusBtn = document.getElementById('view-bonus-words');
    if (viewBonusBtn) {
      viewBonusBtn.textContent = '无奖励单词';
      viewBonusBtn.disabled = true;
      viewBonusBtn.classList.add('disabled');
    }
    // 触发网格变化事件
    this.triggerGridChangeEvent();
    // 显示完成消息（仅非静默模式）
    if (!silent) {
      showStatusMessage('网格已重置，所有单词和字母已清除', 'success');
    }
  }

  // 加载网格字母数据
  loadGridLetters(lettersArray) {
    if (!lettersArray || !Array.isArray(lettersArray) || lettersArray.length === 0) {
      console.error('无效的字母数组数据');
      return;
    }
    
    console.log('开始加载网格字母:', lettersArray);
    
    const height = lettersArray.length;
    const width = lettersArray[0].length;
    
    // 确保网格大小已正确设置
    if (this.height !== height || this.width !== width) {
      console.error('网格大小不匹配，请先调用setSize方法');
      return;
    }
    
    // 将字母填充到网格中
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        // 获取字母，确保是字符串并转为大写
        let letter = lettersArray[row][col];
        
        // 处理字符串格式和二维数组格式
        if (typeof letter === 'string') {
          // 如果是空格，转换为空字符串
          letter = letter.trim() === '' || letter === ' ' ? '' : letter.trim().toUpperCase();
        } else {
          letter = '';
        }
        
        // 记录位置和字母，便于调试
        if (row >= 7) {
          console.log(`设置网格位置 [${row},${col}] = "${letter}", 原始字母="${lettersArray[row][col]}"`);
        }
        
        // 更新内部数据结构
        this.letters[row][col] = letter;
        
        // 更新DOM显示
        const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.textContent = letter;
          
          // 初始应用浅绿色背景
          if (letter) {
            cell.classList.add('manual');
            cell.style.backgroundColor = '#e8f5e9'; // 浅绿色
            cell.style.borderColor = '#c8e6c9';
            cell.style.color = '#000000';
          } else {
            // 空格，清除所有样式
            cell.classList.remove('placed', 'manual', 'intersection');
            cell.style.backgroundColor = '';
            cell.style.background = '';
            cell.style.borderColor = '';
            cell.style.color = '';
          }
        }
      }
    }
    
    console.log('成功加载网格字母数据');
  }
  
  // 加载已放置的单词数据
  loadPlacedWords(placedWordsArray) {
    if (!placedWordsArray || !Array.isArray(placedWordsArray)) {
      console.error('无效的已放置单词数组');
      return;
    }
    
    console.log('加载放置单词:', placedWordsArray);
    
    // 清空现有的已放置单词
    this.placedWords = [];
    
    // 收集所有属于单词的位置
    const wordPositions = new Set();
    
    // 加载每个已放置的单词
    placedWordsArray.forEach((wordData, index) => {
      if (!wordData.word || !wordData.positions || !Array.isArray(wordData.positions)) {
        console.warn(`跳过无效的单词数据:`, wordData);
        return;
      }
      
      // 记录单词的所有位置
      wordData.positions.forEach(pos => {
        wordPositions.add(`${pos.row},${pos.col}`);
      });
      
      // 优先使用已有的颜色，如果没有才分配新颜色
      let color = wordData.color || this.colorMap[wordData.word];
      if (!color) {
        color = this.assignColorToWord(wordData.word);
      } else {
        // 确保colorMap中有正确的映射
        this.colorMap[wordData.word] = color;
      }
      
      // 创建处理后的单词数据
      const processedWord = {
        word: wordData.word,
        positions: wordData.positions,
        color,
        id: wordData.id || index,
        direction: wordData.direction || 'horizontal',
        isDragged: true, // 导入的单词当作拖拽放置的单词处理
        isGold: wordData.isGold || false,
        isBlackDot: wordData.isBlackDot || false
      };
      
      // 添加到已放置单词列表
      this.placedWords.push(processedWord);
      
      // 在网格上显示单词（仅在目标位置为空时写入字母，避免覆盖原有网格数据）
      processedWord.positions.forEach((pos, i) => {
        const { row, col } = pos;
        if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
          if (!this.letters[row][col]) {
            const letter = processedWord.word[i] || '';
            if (letter) {
              this.letters[row][col] = letter;
            }
          }
        }
      });
    });
    
    // 更新网格中的所有单元格显示
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const letter = this.letters[row][col];
        const isWordPosition = wordPositions.has(`${row},${col}`);
        const cell = this.gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell) continue;
        
        // 清除旧样式
        cell.className = 'grid-cell';
        cell.style.cssText = '';
        
        if (!letter) {
          // 空单元格，保持无样式
          cell.textContent = '';
        } else if (isWordPosition) {
          // 单词字母 - 使用深色背景
          cell.textContent = letter;
          cell.classList.add('placed');
          
          // 查找此位置属于哪个单词
          for (const placedWord of this.placedWords) {
            if (placedWord.positions.some(pos => pos.row === row && pos.col === col)) {
              // 使用单词的颜色
              cell.style.backgroundColor = placedWord.color;
              cell.style.borderColor = this.adjustColor(placedWord.color, -40);
              cell.style.color = '#000000';
              cell.style.fontWeight = 'bold';
              break;
            }
          }
        } else {
          // 非单词字母 - 使用浅绿色背景
          cell.textContent = letter;
          cell.classList.add('manual');
          cell.style.backgroundColor = '#e8f5e9'; // 浅绿色
          cell.style.borderColor = '#c8e6c9';
          cell.style.color = '#000000';
        }
      }
    }
    
    // 更新已放置单词列表显示
    this.updatePlacedWordsList();
    
    console.log(`成功加载 ${this.placedWords.length} 个已放置单词`);
  }
  
  // 设置bonus words
  setBonusWords(bonusWordsArray) {
    try {
      if (!bonusWordsArray || !Array.isArray(bonusWordsArray)) {
        console.error('无效的bonus words数组');
        return;
      }
      
      console.log('设置bonus words:', bonusWordsArray);
      
      // 处理奖励单词，确保是字符串数组
      const bonusWords = bonusWordsArray.map(word => {
        if (typeof word === 'string') {
          return word.trim().toUpperCase();
        } else if (typeof word === 'object' && word !== null && word.word) {
          return word.word.trim().toUpperCase();
        } else {
          console.warn('忽略无效的奖励单词:', word);
          return null;
        }
      }).filter(Boolean); // 过滤掉null和空字符串
      
      if (bonusWords.length === 0) {
        console.log('没有有效的奖励单词');
        // 更新"查看奖励单词"按钮状态
        const viewBonusBtn = document.getElementById('view-bonus-words');
        if (viewBonusBtn) {
          viewBonusBtn.textContent = '无奖励单词';
          viewBonusBtn.disabled = true;
          viewBonusBtn.classList.add('disabled');
        }
        
        // 清空模态框
        this.populateBonusWordsList([]);
        return;
      }
      
      console.log(`处理了 ${bonusWords.length} 个奖励单词`);
      
      // 创建带有显示对象的奖励单词列表
      const bonusWordsWithPositions = bonusWords.map(word => ({
        word: word,
        positions: [] // 初始时没有位置信息
      }));
      
      // 更新"查看奖励单词"按钮状态
      const viewBonusBtn = document.getElementById('view-bonus-words');
      if (viewBonusBtn) {
        viewBonusBtn.textContent = `查看奖励单词 (${bonusWords.length})`;
        viewBonusBtn.disabled = false;
        viewBonusBtn.classList.remove('disabled');
      }
      
      // 更新模态框
      this.populateBonusWordsList(bonusWordsWithPositions);
      
      // 更新计数
      const countElement = document.getElementById('bonus-words-count');
      if (countElement) {
        countElement.textContent = bonusWords.length;
      }
      
      console.log(`成功设置 ${bonusWords.length} 个奖励单词`);
      
      // 存储全局奖励单词数据
      window.bonusWordsData = {
        words: bonusWords,
        wordsWithPositions: bonusWordsWithPositions
      };
      
      return bonusWords;
    } catch (error) {
      console.error('设置奖励单词时出错:', error);
      return [];
    }
  }
  
  // 在网格中查找指定单词并返回其位置
  findWordInGrid(word, grid) {
    if (!word || !grid || !grid.length) return { positions: [], direction: null };
    
    const H = grid.length;
    const W = grid[0].length;
    
    // 检查所有可能的位置和方向
    // 1. 水平方向
    for (let r = 0; r < H; r++) {
      for (let c = 0; c <= W - word.length; c++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (!grid[r][c+i] || grid[r][c+i].toUpperCase() !== word[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          const positions = [];
          for (let i = 0; i < word.length; i++) {
            positions.push({ row: r, col: c+i });
          }
          return { positions, direction: 'horizontal' };
        }
      }
    }
    
    // 2. 垂直方向
    for (let c = 0; c < W; c++) {
      for (let r = 0; r <= H - word.length; r++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (!grid[r+i][c] || grid[r+i][c].toUpperCase() !== word[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          const positions = [];
          for (let i = 0; i < word.length; i++) {
            positions.push({ row: r+i, col: c });
          }
          return { positions, direction: 'vertical' };
        }
      }
    }
    
    // 3. 右下斜方向
    for (let r = 0; r <= H - word.length; r++) {
      for (let c = 0; c <= W - word.length; c++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (!grid[r+i][c+i] || grid[r+i][c+i].toUpperCase() !== word[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          const positions = [];
          for (let i = 0; i < word.length; i++) {
            positions.push({ row: r+i, col: c+i });
          }
          return { positions, direction: 'diagonal' };
        }
      }
    }
    
    // 4. 左下斜方向
    for (let r = 0; r <= H - word.length; r++) {
      for (let c = word.length - 1; c < W; c++) {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (!grid[r+i][c-i] || grid[r+i][c-i].toUpperCase() !== word[i]) {
            match = false;
            break;
          }
        }
        
        if (match) {
          const positions = [];
          for (let i = 0; i < word.length; i++) {
            positions.push({ row: r+i, col: c-i });
          }
          return { positions, direction: 'reverseDiagonal' };
        }
      }
    }
    
    // 没找到匹配
    return { positions: [], direction: null };
  }

  // 直接用外部关卡数据渲染预览页面
  showPreviewWithData(levelData) {
    const previewPage = document.getElementById('preview-page');
    const previewGrid = document.getElementById('preview-grid');
    const previewWordList = document.getElementById('preview-word-list');
    const previewTitle = document.getElementById('preview-title');
    if (!previewPage || !previewGrid || !previewWordList) {
      console.error('找不到预览页面所需的DOM元素');
      return;
    }
    // 清空内容
    previewGrid.innerHTML = '';
    previewWordList.innerHTML = '';
    // 标题
    previewTitle.textContent = levelData.title || 'Word Search 关卡';
    // 解析网格
    let gridArr = levelData.grid;
    if (Array.isArray(gridArr) && typeof gridArr[0] === 'string') {
      gridArr = gridArr.map(row => row.split(''));
    } else if (levelData.grid.letters) {
      gridArr = levelData.grid.letters;
    }
    const rows = gridArr.length;
    const cols = gridArr[0].length;
    previewGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    // 渲染网格
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'preview-grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.textContent = gridArr[r][c] || '*';
        previewGrid.appendChild(cell);
      }
    }
    // 渲染单词和色块
    const colors = [
      '#8e44ad', '#e74c3c', '#27ae60', '#2980b9', '#f39c12', '#d35400', '#16a085', '#f1c40f', '#c0392b', '#2c3e50', '#7f8c8d'
    ];
    (levelData.words || []).forEach((w, idx) => {
      // 单词标签
      const wordSpan = document.createElement('div');
      wordSpan.className = 'preview-word';
      wordSpan.textContent = w.word;
      wordSpan.style.backgroundColor = colors[idx % colors.length];
      previewWordList.appendChild(wordSpan);
      // 高亮网格
      if (w.pos) {
        const [start, end] = w.pos.split(';');
        if (start && end) {
          const [sr, sc] = start.split(',').map(Number);
          const [er, ec] = end.split(',').map(Number);
          const len = w.word.length;
          const dr = er === sr ? 0 : (er > sr ? 1 : -1);
          const dc = ec === sc ? 0 : (ec > sc ? 1 : -1);
          for (let k = 0; k < len; k++) {
            const rr = sr + k * dr;
            const cc = sc + k * dc;
            const cell = previewGrid.querySelector(`.preview-grid-cell[data-row="${rr}"][data-col="${cc}"]`);
            if (cell) {
              cell.style.background = colors[idx % colors.length] + '33';
              cell.style.fontWeight = 'bold';
              cell.style.color = '#222';
            }
          }
        }
      }
    });
    // 添加特殊单词预览功能
    this.initSpecialWordsPreviewWithData(previewGrid, levelData.words || [], gridArr);
    
    // 跳转显示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    previewPage.classList.add('active');
  }

  // 获取指定位置的字母（用于保存关卡）
  getLetterAt(row, col) {
    // 检查边界
    if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
      return this.letters[row][col] || '';
    }
    return '';
  }
}

// 显示状态消息的辅助函数
function showStatusMessage(message, type = 'success') {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  
  if (type === 'error') {
    statusEl.className = 'show error';
  } else if (type === 'warning') {
    statusEl.className = 'show warning';
  } else {
    statusEl.className = 'show';
  }
  
  // 3秒后隐藏消息
  setTimeout(() => {
    statusEl.className = '';
  }, 3000);
} 