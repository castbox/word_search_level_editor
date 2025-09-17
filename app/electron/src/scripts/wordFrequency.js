// WordFrequency 类 - 管理BNC-COCA词频数据和分层关卡词频分析
class WordFrequency {
  constructor() {
    // 词频数据缓存
    this.frequencyMap = new Map();
    this.isLoaded = false;
    
    // 关卡分析数据
    this.levelAnalysis = {
      formalLevels: new Map(), // 正式关卡数据（按level字段索引）
      editorLevels: new Map(), // 编辑器关卡数据（按level字段索引）
      mergedLevels: new Map(), // 合并后的关卡数据
      wordUsage: new Map(), // 单词使用次数统计
      isAnalysisReady: false,
      currentLevelNumber: 1 // 当前编辑器中的关卡等级
    };
    
    // 词频分级阈值
    this.thresholds = {
      high: 3000,    // 1k-3k为高频词
      medium: 9000   // 4k-9k为中频词，10k+为低频词
    };
    
    // 加载词频数据
    this.loadFrequencyData();
    
    // 分析关卡数据
    this.analyzeLevelData();
  }
  
  // 设置当前编辑器关卡等级
  setCurrentLevelNumber(levelNumber) {
    this.levelAnalysis.currentLevelNumber = parseInt(levelNumber) || 1;
    console.log(`设置当前关卡等级为: ${this.levelAnalysis.currentLevelNumber}`);
    
    // 重新分析关卡数据
    this.analyzeWordUsage();
  }
  
  // 获取当前编辑器关卡等级
  getCurrentLevelNumber() {
    return this.levelAnalysis.currentLevelNumber;
  }
  
  // 加载词频数据
  async loadFrequencyData() {
    try {
      console.log('开始加载词频数据...');
      await this.loadFromCSVFile();
    } catch (error) {
      console.warn('无法加载词频文件:', error);
      // 如果文件加载失败，使用备用数据
      await this.loadBackupData();
    }
  }
  
  // 分析关卡数据
  async analyzeLevelData() {
    try {
      console.log('开始分析关卡数据...');
      
      // 清空之前的分析结果
      this.levelAnalysis.formalLevels.clear();
      this.levelAnalysis.editorLevels.clear();
      this.levelAnalysis.mergedLevels.clear();
      this.levelAnalysis.wordUsage.clear();
      
      // 加载正式关卡数据
      await this.loadFormalLevels();
      
      // 加载编辑器关卡数据
      await this.loadEditorLevels();
      
      // 合并关卡数据
      this.mergeLevelData();
      
      // 分析单词使用情况
      this.analyzeWordUsage();
      
      this.levelAnalysis.isAnalysisReady = true;
      console.log('关卡分析完成');
      console.log(`正式关卡: ${this.levelAnalysis.formalLevels.size} 个`);
      console.log(`编辑器关卡: ${this.levelAnalysis.editorLevels.size} 个`);
      console.log(`合并后关卡: ${this.levelAnalysis.mergedLevels.size} 个`);
      console.log(`统计到 ${this.levelAnalysis.wordUsage.size} 个不同单词`);
      
    } catch (error) {
      console.error('关卡分析失败:', error);
      this.levelAnalysis.isAnalysisReady = true;
    }
  }
  
  // 加载正式关卡数据
  async loadFormalLevels() {
    try {
      console.log('加载正式关卡数据...');
      
      // 读取正式关卡文件
      if (!window.electronAPI || !window.electronAPI.readFile) {
        console.log('electronAPI不可用，跳过正式关卡加载');
        return;
      }
      
      const formalLevelPath = 'levels/lv1_500.json';
      const result = await window.electronAPI.readFile(formalLevelPath);
      
      if (!result.success) {
        console.log('正式关卡文件不存在或读取失败:', result.message);
        return;
      }
      
      const levelData = JSON.parse(result.content);
      
      if (Array.isArray(levelData)) {
        levelData.forEach((level, index) => {
          if (level.level && typeof level.level === 'number') {
            const extractedWords = this.extractWordsFromLevel(level);
            
            this.levelAnalysis.formalLevels.set(level.level, {
              ...level,
              source: 'formal',
              words: extractedWords
            });
          }
        });
      }
      
      console.log(`加载了 ${this.levelAnalysis.formalLevels.size} 个正式关卡`);
      
    } catch (error) {
      console.error('加载正式关卡失败:', error);
    }
  }
  
  // 加载编辑器关卡数据
  async loadEditorLevels() {
    try {
      console.log('加载编辑器关卡数据...');
      
      if (!window.electronAPI || !window.electronAPI.getSavedLevels) {
        console.log('electronAPI不可用，跳过编辑器关卡加载');
        return;
      }
      
      const editorLevels = await window.electronAPI.getSavedLevels();
      
      if (!editorLevels || editorLevels.length === 0) {
        console.log('未找到编辑器关卡文件');
        return;
      }
      
      editorLevels.forEach(levelData => {
        if (levelData.level && typeof levelData.level === 'number') {
          this.levelAnalysis.editorLevels.set(levelData.level, {
            ...levelData,
            source: 'editor',
            words: this.extractWordsFromLevel(levelData)
          });
        }
      });
      
      console.log(`加载了 ${this.levelAnalysis.editorLevels.size} 个编辑器关卡`);
      
    } catch (error) {
      console.error('加载编辑器关卡失败:', error);
    }
  }
  
  // 合并关卡数据（编辑器关卡优先）
  mergeLevelData() {
    console.log('合并关卡数据...');
    
    // 先添加所有正式关卡
    for (const [levelNum, levelData] of this.levelAnalysis.formalLevels) {
      this.levelAnalysis.mergedLevels.set(levelNum, levelData);
    }
    
    // 编辑器关卡覆盖同等级的正式关卡
    for (const [levelNum, levelData] of this.levelAnalysis.editorLevels) {
      if (this.levelAnalysis.mergedLevels.has(levelNum)) {
        console.log(`关卡 ${levelNum} 使用编辑器版本覆盖正式版本`);
      }
      this.levelAnalysis.mergedLevels.set(levelNum, levelData);
    }
    
    console.log(`合并完成，共 ${this.levelAnalysis.mergedLevels.size} 个关卡`);
  }
  
  // 分析单词使用情况
  analyzeWordUsage() {
    console.log(`分析单词使用情况（基于关卡 1-${this.levelAnalysis.currentLevelNumber}）...`);
    
    // 清空之前的统计
    this.levelAnalysis.wordUsage.clear();
    
    // 获取当前关卡等级范围内的关卡
    const targetLevels = [];
    for (let i = 1; i <= this.levelAnalysis.currentLevelNumber; i++) {
      if (this.levelAnalysis.mergedLevels.has(i)) {
        targetLevels.push(this.levelAnalysis.mergedLevels.get(i));
      }
    }
    
    console.log(`在范围内找到 ${targetLevels.length} 个关卡进行统计`);
    
    // 统计每个单词的使用情况
    targetLevels.forEach((levelData, index) => {
      const levelNum = levelData.level;
      const words = levelData.words || [];
      
      words.forEach(word => {
        const normalizedWord = word.toUpperCase().trim();
        if (!normalizedWord) return;
        
        // 更新总体统计
        if (!this.levelAnalysis.wordUsage.has(normalizedWord)) {
          this.levelAnalysis.wordUsage.set(normalizedWord, {
            totalCount: 0,
            recent5Count: 0,
            levels: [],
            recent5Levels: []
          });
        }
        
        const usage = this.levelAnalysis.wordUsage.get(normalizedWord);
        usage.totalCount++;
        usage.levels.push({
          levelNumber: levelNum,
          title: levelData.title || `关卡${levelNum}`,
          id: levelData.id || `level_${levelNum}`,
          source: levelData.source,
          createdAt: levelData.metadata?.createdAt || Date.now()
        });
        
        // 统计近5关的使用情况（相对于当前关卡等级）
        const recentThreshold = Math.max(1, this.levelAnalysis.currentLevelNumber - 4);
        if (levelNum >= recentThreshold) {
          usage.recent5Count++;
          usage.recent5Levels.push({
            levelNumber: levelNum,
            title: levelData.title || `关卡${levelNum}`,
            id: levelData.id || `level_${levelNum}`,
            source: levelData.source,
            createdAt: levelData.metadata?.createdAt || Date.now()
          });
        }
      });
    });
    
    console.log(`单词使用情况分析完成，统计了 ${this.levelAnalysis.wordUsage.size} 个不同单词`);
  }
  
  // 从关卡数据中提取单词
  extractWordsFromLevel(levelData) {
    const words = [];
    
    // 从words数组中提取
    if (levelData.words && Array.isArray(levelData.words)) {
      levelData.words.forEach(wordItem => {
        if (typeof wordItem === 'string') {
          words.push(wordItem);
        } else if (wordItem.word) {
          words.push(wordItem.word);
        }
      });
    }
    
    // 从grid.placedWords中提取（编辑器格式）
    if (levelData.grid && levelData.grid.placedWords && Array.isArray(levelData.grid.placedWords)) {
      levelData.grid.placedWords.forEach(wordItem => {
        if (wordItem.word) {
          words.push(wordItem.word);
        }
      });
    }
    
    return words;
  }
  
  // 获取单词的关卡使用统计
  getWordLevelStats(word) {
    if (!this.levelAnalysis.isAnalysisReady) {
      return {
        isReady: false,
        message: '关卡分析尚未完成'
      };
    }
    
    const normalizedWord = word.toUpperCase().trim();
    const usage = this.levelAnalysis.wordUsage.get(normalizedWord);
    
    if (!usage) {
      return {
        isReady: true,
        totalCount: 0,
        recent5Count: 0,
        levels: [],
        recent5Levels: [],
        isFirstTime: true,
        currentLevelRange: `1-${this.levelAnalysis.currentLevelNumber}`
      };
    }
    
    return {
      isReady: true,
      totalCount: usage.totalCount,
      recent5Count: usage.recent5Count,
      levels: usage.levels,
      recent5Levels: usage.recent5Levels,
      isFirstTime: false,
      currentLevelRange: `1-${this.levelAnalysis.currentLevelNumber}`
    };
  }
  
  // 获取单词的完整频率信息（包括BNC-COCA和关卡统计）
  getCompleteWordInfo(word) {
    const bncFreq = this.getWordFrequencyInfo(word);
    const levelStats = this.getWordLevelStats(word);
    
    return {
      word: word,
      bnc: bncFreq,
      levelStats: levelStats,
      hasLevelData: levelStats.isReady,
      isNewWord: levelStats.isFirstTime
    };
  }
  
  // 获取关卡统计概览
  getLevelAnalysisOverview() {
    if (!this.levelAnalysis.isAnalysisReady) {
      return {
        isReady: false,
        message: '关卡分析尚未完成'
      };
    }
    
    const currentRange = `1-${this.levelAnalysis.currentLevelNumber}`;
    const totalLevelsInRange = Array.from(this.levelAnalysis.mergedLevels.keys())
      .filter(levelNum => levelNum <= this.levelAnalysis.currentLevelNumber).length;
    
    const totalUniqueWords = this.levelAnalysis.wordUsage.size;
    const totalWordUsages = Array.from(this.levelAnalysis.wordUsage.values())
      .reduce((sum, usage) => sum + usage.totalCount, 0);
    
    // 获取最常用的单词
    const mostUsedWords = Array.from(this.levelAnalysis.wordUsage.entries())
      .sort(([,a], [,b]) => b.totalCount - a.totalCount)
      .slice(0, 10)
      .map(([word, usage]) => ({
        word,
        count: usage.totalCount,
        recent5Count: usage.recent5Count
      }));
    
    return {
      isReady: true,
      currentLevelRange: currentRange,
      totalLevelsInRange,
      totalFormalLevels: this.levelAnalysis.formalLevels.size,
      totalEditorLevels: this.levelAnalysis.editorLevels.size,
      totalUniqueWords,
      totalWordUsages,
      averageWordsPerLevel: totalLevelsInRange > 0 ? Math.round(totalWordUsages / totalLevelsInRange) : 0,
      mostUsedWords
    };
  }
  
  // 刷新关卡分析（当有新关卡保存时调用）
  async refreshAnalysis() {
    console.log('刷新关卡分析...');
    await this.analyzeLevelData();
  }
  
  // 从CSV文件加载数据 - Electron版本
  async loadFromCSVFile() {
    try {
      // 检查是否在Electron环境中
      if (typeof window.electronAPI === 'undefined') {
        throw new Error('不在Electron环境中，无法读取本地文件');
      }
      
      console.log('使用Electron API读取词频CSV文件...');
      const result = await window.electronAPI.readFrequencyCSV();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      console.log('CSV文件加载成功，开始解析...');
      
      this.parseCSVData(result.content);
      this.isLoaded = true;
      
      console.log(`词频数据加载完成！包含 ${this.frequencyMap.size} 个词汇`);
      console.log('分级标准：1K-3K(高频), 4K-9K(中频), 10K+(低频)');
      
    } catch (error) {
      console.error('加载CSV文件失败:', error);
      throw error;
    }
  }
  
  // 解析CSV数据 - 支持头词和相关词族
  parseCSVData(csvText) {
    const lines = csvText.split('\n');
    let processedCount = 0;
    let headwordCount = 0;
    let relatedwordCount = 0;
    
    console.log(`开始解析CSV，共 ${lines.length} 行`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('List')) continue; // 跳过标题行
      
      // 更智能的CSV解析 - 处理带引号的字段
      const fields = this.parseCSVLine(line);
      if (fields.length < 3) continue;
      
      // 解析各列数据
      const freqStr = fields[0].trim(); // List列 (如 "1k")
      const headword = fields[1].trim(); // Headword列
      const relatedForms = fields[2].trim(); // Related forms列
      
      // 解析频率值（如 "1k" -> 1000）
      const freqValue = this.parseFrequencyValue(freqStr);
      if (freqValue <= 0) continue;
      
      // 处理头词
      if (headword && headword.length > 0) {
        const normalizedHeadword = headword.toUpperCase();
        this.frequencyMap.set(normalizedHeadword, freqValue);
        headwordCount++;
        processedCount++;
        
        // 打印前几个数据以验证
        if (processedCount <= 3) {
          console.log(`解析头词 ${processedCount}: 频率=${freqStr}(${freqValue}), 头词=${normalizedHeadword}`);
        }
      }
      
      // 处理相关词族
      if (relatedForms && relatedForms.length > 0) {
        const relatedWords = this.parseRelatedForms(relatedForms);
        
        for (const relatedWord of relatedWords) {
          if (relatedWord && relatedWord.length > 0) {
            const normalizedRelatedWord = relatedWord.toUpperCase();
            // 如果不是头词本身，则添加（避免重复）
            if (normalizedRelatedWord !== headword.toUpperCase()) {
              this.frequencyMap.set(normalizedRelatedWord, freqValue);
              relatedwordCount++;
              processedCount++;
              
              // 打印前几个相关词示例
              if (relatedwordCount <= 5) {
                console.log(`解析相关词 ${relatedwordCount}: 频率=${freqStr}(${freqValue}), 相关词=${normalizedRelatedWord} (来自头词: ${headword})`);
              }
            }
          }
        }
      }
    }
    
    if (processedCount === 0) {
      throw new Error('CSV文件中没有找到有效的词频数据');
    }
    
    console.log(`成功解析 ${processedCount} 个词汇 (头词: ${headwordCount}, 相关词: ${relatedwordCount})`);
  }
  
  // 解析CSV行 - 正确处理带引号的字段
  parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        // 处理引号
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // 双引号转义
          currentField += '"';
          i += 2;
        } else {
          // 开始或结束引号
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // 字段分隔符（不在引号内）
        fields.push(currentField);
        currentField = '';
        i++;
      } else {
        // 普通字符
        currentField += char;
        i++;
      }
    }
    
    // 添加最后一个字段
    fields.push(currentField);
    
    return fields;
  }
  
  // 解析相关词族字符串
  parseRelatedForms(relatedFormsStr) {
    const words = [];
    
    // 移除外层引号
    let cleanStr = relatedFormsStr.replace(/^"|"$/g, '');
    
    // 按逗号分割，但要考虑括号内的内容
    const parts = [];
    let currentPart = '';
    let inParentheses = false;
    
    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr[i];
      
      if (char === '(') {
        inParentheses = true;
        // 在遇到括号前，先保存当前部分
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
      } else if (char === ')') {
        inParentheses = false;
        // 跳过括号内的内容（频次信息）
      } else if (char === ',' && !inParentheses) {
        // 字段分隔符（不在括号内）
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
        }
        currentPart = '';
      } else if (!inParentheses) {
        // 只添加括号外的字符
        currentPart += char;
      }
    }
    
    // 添加最后一个部分
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }
    
    // 清理和验证每个单词
    for (const part of parts) {
      const word = part.trim();
      // 只保留字母单词，过滤掉数字、特殊字符等
      if (word && /^[A-Za-z]+$/.test(word)) {
        words.push(word);
      }
    }
    
    return words;
  }
  
  // 解析频率值（如 "1K" -> 1000, "2K" -> 2000, "10K" -> 10000）
  parseFrequencyValue(freqStr) {
    if (!freqStr) return 0;
    
    // 去除空格并转换为大写
    const cleanStr = freqStr.trim().toUpperCase();
    
    // 处理 K 结尾的格式
    if (cleanStr.endsWith('K')) {
      const numStr = cleanStr.slice(0, -1);
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return Math.round(num * 1000);
      }
    }
    
    // 处理纯数字格式
    const num = parseInt(cleanStr);
    if (!isNaN(num)) {
      return num;
    }
    
    console.warn(`无法解析频率值: "${freqStr}"`);
    return 0;
  }
  
  // 备用数据（测试用）
  async loadBackupData() {
    console.log('加载备用测试数据...');
    
    // 测试数据：模拟不同频率级别的单词
    const testData = [
      // 高频词 (1K-3K)
      { word: 'THE', freq: 1000 },
      { word: 'BE', freq: 1500 },
      { word: 'TO', freq: 2000 },
      { word: 'HAVE', freq: 2500 },
      { word: 'AND', freq: 3000 },
      
      // 中频词 (4K-9K)
      { word: 'EXAMPLE', freq: 4000 },
      { word: 'SYSTEM', freq: 5000 },
      { word: 'PROGRAM', freq: 6000 },
      { word: 'QUESTION', freq: 7000 },
      { word: 'GOVERNMENT', freq: 8000 },
      { word: 'DEVELOPMENT', freq: 9000 },
      
      // 低频词 (10K+)
      { word: 'ALGORITHM', freq: 10000 },
      { word: 'SOPHISTICATED', freq: 15000 },
      { word: 'UNPRECEDENTED', freq: 20000 },
      
      // 其他范围的低频词
      { word: 'BORDER', freq: 3500 },
      { word: 'CAT', freq: 800 }
    ];
    
    testData.forEach(item => {
      this.frequencyMap.set(item.word, item.freq);
    });
    
    this.isLoaded = true;
    console.log(`备用数据加载完成，包含 ${this.frequencyMap.size} 个测试词汇`);
  }
  
  // 获取单词的词频值
  getWordRank(word) {
    if (!this.isLoaded) {
      console.log('词频数据尚未加载完成');
      return null;
    }
    
    const normalizedWord = word.toUpperCase().trim();
    const freqValue = this.frequencyMap.get(normalizedWord);
    
    if (freqValue) {
      console.log(`单词 "${word}" 的频率值: ${freqValue}`);
    }
    
    return freqValue || null;
  }
  
  // 获取单词的频率级别
  getFrequencyLevel(word) {
    const freqValue = this.getWordRank(word);
    
    if (freqValue === null) {
      return 'unknown'; // 未知词汇
    }
    
    // 按照用户要求的分级标准：1K-3K高频，4K-9K中频，10K+低频
    if (freqValue >= 1000 && freqValue <= 3000) {
      return 'high'; // 高频词 (1K-3K)
    } else if (freqValue >= 4000 && freqValue <= 9000) {
      return 'medium'; // 中频词 (4K-9K)
    } else if (freqValue >= 10000) {
      return 'low'; // 低频词 (10K+)
    } else {
      return 'other'; // 其他范围
    }
  }
  
  // 获取频率级别的显示名称
  getFrequencyLevelName(level) {
    const names = {
      high: '高频词',
      medium: '中频词',
      low: '低频词',
      other: '其他',
      unknown: '未知'
    };
    return names[level] || '未知';
  }
  
  // 获取频率级别的颜色
  getFrequencyColor(level) {
    const colors = {
      high: '#2ecc71',    // 绿色 - 高频词
      medium: '#f39c12',  // 橙色 - 中频词
      low: '#e74c3c',     // 红色 - 低频词
      other: '#95a5a6',   // 灰色 - 其他
      unknown: '#7f8c8d'  // 深灰色 - 未知
    };
    return colors[level] || '#7f8c8d';
  }
  
  // 获取单词的频率信息
  getWordFrequencyInfo(word) {
    const level = this.getFrequencyLevel(word);
    const rank = this.getWordRank(word);
    
    return {
      word: word,
      level: level,
      levelName: this.getFrequencyLevelName(level),
      rank: rank,
      color: this.getFrequencyColor(level),
      isKnown: rank !== null
    };
  }
  
  // 批量获取单词频率信息
  getBatchFrequencyInfo(words) {
    return words.map(word => this.getWordFrequencyInfo(word));
  }
  
  // 根据频率级别过滤单词
  filterWordsByLevel(words, level) {
    return words.filter(word => this.getFrequencyLevel(word) === level);
  }
  
  // 获取单词列表的频率统计
  getFrequencyStats(words) {
    const stats = { high: 0, medium: 0, low: 0, other: 0, unknown: 0 };
    
    words.forEach(word => {
      const level = this.getFrequencyLevel(word);
      stats[level]++;
    });
    
    return stats;
  }
}

// 创建全局词频管理实例
const wordFrequency = new WordFrequency(); 