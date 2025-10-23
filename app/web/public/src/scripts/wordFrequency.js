// 词频分析器（Web版 - 完整功能版）
class WordFrequency {
  constructor() {
    this.frequencyMap = new Map(); // Headword -> 数值频段(例如1000,2000,...)
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
    
    // 兼容旧接口：当前关卡编号
    this.currentLevelNumber = 1;

    this.initialize();
  }

  // 初始化：从服务端读取CSV（优先 /api/frequency/csv，失败回退 /api/dictionary/bnc_coca）
  async initialize() {
    try {
      console.log('🔤 [WF] 开始初始化词频，准备拉取CSV...');
      const csvText = await this.fetchCSV();
      console.log('🔤 [WF] 已获取CSV文本，长度:', csvText ? csvText.length : 'null');
      this.parseCSV(csvText);
      this.isLoaded = true;
      console.log(`📚 词频数据加载完成！共 ${this.frequencyMap.size} 个词`);
      this.emitReady();
      
      // 加载并分析关卡数据
      await this.analyzeLevelData();
    } catch (e) {
      console.error('❌ 词频数据加载失败:', e.message || e);
      this.isLoaded = false;
    }
  }

  // 拉取CSV文本
  async fetchCSV() {
    console.log('🔤 [WF] fetchCSV: 先请求 /api/frequency/csv');
    // 1) 首选公开接口（不带任何认证头）
    try {
      const res = await fetch('/api/frequency/csv');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && typeof data.content === 'string') {
          console.log('🔤 [WF] /api/frequency/csv 获取成功');
          return data.content;
        }
        throw new Error(data && data.message ? data.message : '频率接口返回异常');
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('⚠️ [WF] /api/frequency/csv 失败:', e.message || e);
      console.log('🔤 [WF] 改为请求 /api/dictionary/bnc_coca');
    }

    // 2) 回退到无需认证的字典接口
    const res2 = await fetch('/api/dictionary/bnc_coca');
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
    const data2 = await res2.json();
    if (!data2 || typeof data2.content !== 'string') throw new Error('字典接口返回异常');
    console.log('🔤 [WF] /api/dictionary/bnc_coca 获取成功');
    return data2.content;
  }

  // 解析CSV（包含Related forms的完整解析）
  parseCSV(csvText) {
    console.log('🔤 [WF] 开始解析CSV（包含Related forms）');
    const lines = csvText.split('\n');
    let headwordCount = 0;
    let relatedwordCount = 0;
    
    for (let i = 1; i < lines.length; i++) { // 跳过表头
      const line = lines[i].trim();
      if (!line || line.startsWith('List')) continue;
      
      // 使用智能CSV解析（处理带引号的字段）
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
        
        // 打印前几个数据以验证
        if (headwordCount <= 3) {
          console.log(`解析头词 ${headwordCount}: 频率=${freqStr}(${freqValue}), 头词=${normalizedHeadword}`);
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
              
              // 打印前几个相关词示例
              if (relatedwordCount <= 5) {
                console.log(`解析相关词 ${relatedwordCount}: 频率=${freqStr}(${freqValue}), 相关词=${normalizedRelatedWord} (来自头词: ${headword})`);
              }
            }
          }
        }
      }
    }
    
    const totalCount = headwordCount + relatedwordCount;
    console.log(`📊 CSV解析完成：头词 ${headwordCount} 个，相关词 ${relatedwordCount} 个，共 ${totalCount} 条记录`);
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
    
    return 0;
  }

  // 发出“就绪”事件，并通知 WordList 刷新
  emitReady() {
    window.dispatchEvent(new CustomEvent('wordFrequencyReady'));
    if (window.wordListInstance && typeof window.wordListInstance.renderWordList === 'function') {
      window.wordListInstance.renderWordList();
    }
  }

  // 查词频值
  getWordRank(word) {
    if (!this.isLoaded) return null;
    const w = String(word || '').toUpperCase().trim();
    return this.frequencyMap.get(w) || null;
  }

  // 分级（1k-3k: 高频；4k-9k: 中频；>=10k: 低频；其他/未找到: 未知）
  getFrequencyLevel(word) {
    const rank = this.getWordRank(word);
    if (!rank) return 'other';
    if (rank >= 1000 && rank <= 3000) return 'high';
    if (rank >= 4000 && rank <= 9000) return 'medium';
    if (rank >= 10000) return 'low';
    return 'other';
  }

  getFrequencyLevelName(level) {
    return ({ high: '高频词', medium: '中频词', low: '低频词', other: '未知' })[level] || '未知';
  }

  getFrequencyColor(level) {
    return ({ high: '#28a745', medium: '#ffc107', low: '#fd7e14', other: '#6c757d' })[level] || '#6c757d';
  }

  // 对外：取得某个词的频率信息（供 UI 使用）
  getWordFrequencyInfo(word) {
    const level = this.getFrequencyLevel(word);
    const rank = this.getWordRank(word);
    
    // 获取关卡统计（如果已准备好）
    const levelStats = this.getWordLevelStats ? this.getWordLevelStats(word) : {
      isReady: false,
      isFirstTime: false,
      totalCount: 0,
      recent5Count: 0,
      currentLevelRange: '-',
      recent5Levels: [],
      levels: []
    };
    
    return {
      word,
      level,
      levelName: this.getFrequencyLevelName(level),
      rank,
      color: this.getFrequencyColor(level),
      isKnown: rank !== null,
      levelStats: levelStats
    };
  }

  // 统计一组词的分布
  getFrequencyStats(words) {
    const stats = { high: 0, medium: 0, low: 0, other: 0, unknown: 0 };
    (words || []).forEach(w => {
      const level = this.getFrequencyLevel(w);
      if (level === 'other' && !this.getWordRank(w)) stats.unknown++;
      else stats[level]++;
    });
    return stats;
  }

  // ===== 关卡使用统计功能 =====
  
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
  
  // 加载正式关卡数据（从服务器）
  async loadFormalLevels() {
    try {
      console.log('加载正式关卡数据...');
      
      // 使用Web API获取正式关卡文件
      const response = await fetch('/api/formal-levels/lv1_500.json');
      if (!response.ok) {
        console.log('正式关卡文件不存在或读取失败');
        return;
      }
      
      const result = await response.json();
      if (!result.success || !result.data) {
        console.log('正式关卡数据格式错误');
        return;
      }
      
      const levelData = result.data;
      
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
  
  // 加载编辑器关卡数据（从服务器）
  async loadEditorLevels() {
    try {
      console.log('加载编辑器关卡数据...');
      
      // 使用Web API获取已保存的关卡
      if (!window.electronAPI || !window.electronAPI.getSavedLevels) {
        console.log('API不可用，跳过编辑器关卡加载');
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
    
    // 计算最大关卡等级作为统计范围
    if (this.levelAnalysis.mergedLevels.size > 0) {
      const maxLevel = Math.max(...this.levelAnalysis.mergedLevels.keys());
      this.levelAnalysis.currentLevelNumber = maxLevel;
      this.currentLevelNumber = maxLevel; // 保持兼容
      console.log(`自动设置统计范围为: 1-${maxLevel}`);
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

  // ===== 兼容旧版全局分析器接口（避免app.js调用报错）=====
  // 旧代码会调用：globalFrequencyAnalyzer.setCurrentLevelNumber(n)
  setCurrentLevelNumber(levelNumber) {
    this.levelAnalysis.currentLevelNumber = parseInt(levelNumber, 10) || 1;
    this.currentLevelNumber = this.levelAnalysis.currentLevelNumber; // 保持兼容
    console.log(`设置当前关卡等级为: ${this.levelAnalysis.currentLevelNumber}`);
    
    // 重新分析关卡数据
    this.analyzeWordUsage();
  }

  // 旧代码会在关卡保存后调用：globalFrequencyAnalyzer.refreshAnalysis()
  async refreshAnalysis() {
    console.log('刷新关卡分析...');
    await this.analyzeLevelData();
  }
}

// 挂到全局
if (typeof window !== 'undefined') {
  window.WordFrequency = WordFrequency;
}