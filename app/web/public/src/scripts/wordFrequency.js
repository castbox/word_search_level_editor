// 词频分析器（重写版）：按“读取CSV→查词→分级显示”的最简流程实现
class WordFrequency {
  constructor() {
    this.frequencyMap = new Map(); // Headword -> 数值频段(例如1000,2000,...)
    this.isLoaded = false;
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

  // 解析CSV（按前两列：List, Headword）
  parseCSV(csvText) {
    console.log('🔤 [WF] 开始解析CSV');
    const lines = csvText.split('\n');
    let count = 0;
    for (let i = 1; i < lines.length; i++) { // 跳过表头
      const line = lines[i];
      if (!line) continue;
      // 简单切分：我们只取前两列，后面的被引号包裹的列表即使包含逗号也不影响前两列定位
      const firstComma = line.indexOf(',');
      if (firstComma < 0) continue;
      const secondComma = line.indexOf(',', firstComma + 1);
      if (secondComma < 0) continue;

      const listCol = line.slice(0, firstComma).trim(); // 例如 "1k"
      const headwordCol = line.slice(firstComma + 1, secondComma).trim().toUpperCase();
      if (!headwordCol) continue;

      // 转成数值频段
      let rank = 0;
      if (/^\d+\s*k$/i.test(listCol)) {
        rank = parseInt(listCol) * 1000; // 1k -> 1000
      } else {
        const n = parseInt(listCol);
        rank = Number.isFinite(n) ? n : 0;
      }

      if (rank > 0) {
        this.frequencyMap.set(headwordCol, rank);
        count++;
      }
    }
    console.log(`📊 CSV解析完成：写入 ${count} 条记录`);
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
    return {
      word,
      level,
      levelName: this.getFrequencyLevelName(level),
      rank,
      color: this.getFrequencyColor(level),
      isKnown: rank !== null,
      // 提供一个默认的关卡统计对象，避免旧代码访问 levelStats 报错
      levelStats: {
        isReady: false,
        isFirstTime: false,
        totalCount: 0,
        recent5Count: 0,
        currentLevelRange: '-',
        recent5Levels: [],
        levels: []
      }
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

  // ===== 兼容旧版全局分析器接口（避免app.js调用报错）=====
  // 旧代码会调用：globalFrequencyAnalyzer.setCurrentLevelNumber(n)
  setCurrentLevelNumber(levelNumber) {
    this.currentLevelNumber = parseInt(levelNumber, 10) || 1;
    console.log('🔢 [WF] setCurrentLevelNumber ->', this.currentLevelNumber);
  }

  // 旧代码会在关卡保存后调用：globalFrequencyAnalyzer.refreshAnalysis()
  // 现在词频只依赖CSV，不需要额外分析，这里做空实现以保持兼容
  async refreshAnalysis() {
    console.log('🔁 [WF] refreshAnalysis (noop)');
    return;
  }
}

// 挂到全局
if (typeof window !== 'undefined') {
  window.WordFrequency = WordFrequency;
}