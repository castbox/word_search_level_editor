# 词频系统更新说明

## 更新日期
2025-10-23

## 更新内容

### 问题1：Related forms 解析问题修复

**问题描述：**
- Web版的CSV解析只读取了前两列（List和Headword）
- 完全忽略了第三列的Related forms（相关词族）
- 导致很多词汇的变形（如has, had, having等）都显示为"未知词语"

**解决方案：**
在 `app/web/public/src/scripts/wordFrequency.js` 中添加了完整的CSV解析逻辑：

1. **parseCSVLine()** - 智能CSV行解析
   - 正确处理带引号的字段
   - 支持引号内的逗号
   - 处理双引号转义

2. **parseRelatedForms()** - 相关词族解析
   - 移除外层引号
   - 按逗号分割（跳过括号内的频次信息）
   - 只保留纯字母单词
   - 过滤特殊字符

3. **parseFrequencyValue()** - 频率值解析
   - "1k" → 1000
   - "2k" → 2000
   - 支持纯数字格式

**CSV文件格式示例：**
```csv
List,Headword,Related forms
1k,HAVE,"has, had, having (12345), haves (678)"
2k,MAKE,"makes, made, making (9876), maker (543)"
```

**解析逻辑：**
```javascript
// 头词：HAVE → 存入 frequencyMap[HAVE] = 1000
// 相关词：
//   - has → frequencyMap[HAS] = 1000
//   - had → frequencyMap[HAD] = 1000
//   - having → frequencyMap[HAVING] = 1000
//   - haves → frequencyMap[HAVES] = 1000
// 括号内的频次信息（12345）会被跳过
```

---

### 问题2：关卡使用统计功能移植

**问题描述：**
- Electron版有完整的关卡使用统计功能（总使用次数、近5关使用等）
- Web版缺少这些功能
- 用户希望在Web版也能看到单词的使用历史

**解决方案：**
将Electron版的完整关卡分析逻辑移植到Web版：

#### 新增的数据结构

```javascript
levelAnalysis = {
  formalLevels: Map(),    // 正式关卡（lv1_500.json）
  editorLevels: Map(),    // 编辑器关卡（用户创建的）
  mergedLevels: Map(),    // 合并后的关卡（编辑器优先）
  wordUsage: Map(),       // 单词使用次数统计
  isAnalysisReady: false,
  currentLevelNumber: 1   // 当前编辑的关卡等级
}
```

#### 新增的方法

1. **analyzeLevelData()** - 主分析流程
   - 清空之前的分析结果
   - 加载正式关卡和编辑器关卡
   - 合并数据并统计单词使用情况

2. **loadFormalLevels()** - 加载正式关卡
   - 从 `/api/formal-levels/lv1_500.json` 获取
   - 解析关卡数据并提取单词
   - 存入 formalLevels Map

3. **loadEditorLevels()** - 加载编辑器关卡
   - 调用 `window.electronAPI.getSavedLevels()`
   - 解析关卡数据并提取单词
   - 存入 editorLevels Map

4. **mergeLevelData()** - 合并关卡数据
   - 先添加所有正式关卡
   - 编辑器关卡覆盖同等级的正式关卡
   - 确保最新版本的关卡数据被使用

5. **analyzeWordUsage()** - 分析单词使用情况
   - 统计范围：第1关 ~ 当前关卡等级
   - 计算总使用次数
   - 计算近5关使用次数
   - 记录使用历史（哪些关卡用过）

6. **extractWordsFromLevel()** - 从关卡提取单词
   - 支持 `words` 数组格式
   - 支持 `grid.placedWords` 格式

7. **getWordLevelStats()** - 获取单词统计
   ```javascript
   {
     isReady: true,
     totalCount: 3,        // 总使用次数
     recent5Count: 1,      // 近5关使用次数
     levels: [...],        // 完整使用历史
     recent5Levels: [...], // 近5关历史
     isFirstTime: false,   // 是否首次使用
     currentLevelRange: "1-147"
   }
   ```

8. **getCompleteWordInfo()** - 获取完整信息
   - BNC-COCA词频信息
   - 关卡使用统计
   - 是否为新单词标识

#### 动态统计范围

统计范围基于**当前编辑的关卡等级**：

```javascript
// 用户正在编辑第147关
currentLevelNumber = 147

// 统计范围：第1关 ~ 第147关
// 近5关：第143关 ~ 第147关

// 示例：
// "CAT" 在第10关、第50关、第145关使用过
// 结果：
{
  totalCount: 3,      // 在1-147范围内使用3次
  recent5Count: 1     // 在143-147范围内使用1次
}
```

#### 更新机制

1. **初始化时**：自动分析所有关卡
2. **关卡等级变化时**：重新统计使用情况
3. **保存关卡后**：重新加载并分析关卡数据

---

## 使用效果

### 1. Related forms 解析生效

**之前：**
```
HAVE  → ✅ 高频词
HAS   → ❌ 未知词
HAD   → ❌ 未知词
HAVING → ❌ 未知词
```

**现在：**
```
HAVE  → ✅ 高频词 (1000)
HAS   → ✅ 高频词 (1000) - 来自HAVE的Related forms
HAD   → ✅ 高频词 (1000) - 来自HAVE的Related forms
HAVING → ✅ 高频词 (1000) - 来自HAVE的Related forms
```

### 2. 关卡统计功能生效

**单词列表显示：**
```
CAT
├─ 📊 高频词 (BNC-COCA: 800)
├─ 📈 使用次数: 3
└─ ✨ (如果是新单词)
```

**点击 `!` 按钮查看详情：**
```
单词: CAT
━━━━━━━━━━━━━━━
📊 BNC-COCA词频
  词频等级: 高频词
  词频排名: 第800位

🎯 关卡使用统计
  统计范围: 关卡 1-147
  总使用次数: 3
  近5关使用: 1

📝 使用历史
  近期使用:
    - 关卡145: 动物主题
  
  全部历史:
    - 关卡10: 宠物关卡
    - 关卡50: 动物园
    - 关卡145: 动物主题
```

---

## 技术细节

### CSV解析优化

**原始数据：**
```csv
1k,HAVE,"has, had, having (12345), haves (678)"
```

**解析步骤：**
1. 分割三个字段（处理引号）
2. 提取频率值：1k → 1000
3. 提取头词：HAVE
4. 解析Related forms：
   - 按逗号分割（跳过括号内容）
   - 结果：["has", "had", "having", "haves"]
5. 存入Map：
   - HAVE → 1000
   - HAS → 1000
   - HAD → 1000
   - HAVING → 1000
   - HAVES → 1000

### 关卡合并策略

**场景：**
- 正式关卡：Level 1, 2, 3, ..., 500
- 编辑器关卡：Level 3（修改版）, Level 147（新版）

**合并结果：**
```javascript
mergedLevels.set(1, formalLevel1)      // 使用正式版本
mergedLevels.set(2, formalLevel2)      // 使用正式版本
mergedLevels.set(3, editorLevel3)      // 使用编辑器版本（覆盖）
mergedLevels.set(4, formalLevel4)      // 使用正式版本
// ...
mergedLevels.set(147, editorLevel147)  // 使用编辑器版本
// ...
mergedLevels.set(500, formalLevel500)  // 使用正式版本
```

**优先级原则：**
编辑器关卡 > 正式关卡（确保使用最新版本）

---

## 测试建议

### 1. Related forms测试

在控制台输入：
```javascript
// 测试头词
console.log(window.wordFrequencyInstance.getWordRank('HAVE'));
// 应该显示：1000

// 测试相关词
console.log(window.wordFrequencyInstance.getWordRank('HAS'));
console.log(window.wordFrequencyInstance.getWordRank('HAD'));
console.log(window.wordFrequencyInstance.getWordRank('HAVING'));
// 应该都显示：1000
```

### 2. 关卡统计测试

1. 打开Web版编辑器
2. 设置关卡等级为147
3. 添加一个单词（如CAT）
4. 查看单词列表，应显示：
   - BNC-COCA词频标签
   - 使用次数或✨新单词标识
5. 点击 `!` 按钮，查看详细统计
6. 修改关卡等级，统计范围应自动更新

---

## 兼容性说明

### 向后兼容

所有修改都保持了向后兼容：

1. **旧的API继续可用**：
   - `getWordRank(word)`
   - `getFrequencyLevel(word)`
   - `getWordFrequencyInfo(word)`
   - `setCurrentLevelNumber(n)`
   - `refreshAnalysis()`

2. **数据结构扩展**：
   - `getWordFrequencyInfo()` 现在返回包含 `levelStats` 的对象
   - 如果关卡分析未完成，levelStats 返回默认值

3. **渐进增强**：
   - 如果正式关卡文件不存在，只使用编辑器关卡
   - 如果编辑器关卡为空，只使用正式关卡
   - 都不存在时，关卡统计功能自动禁用，但BNC-COCA词频仍然可用

---

## 性能优化

1. **懒加载**：关卡分析在词频数据加载完成后异步进行
2. **缓存机制**：使用Map结构快速查询
3. **增量更新**：修改关卡等级时只重新统计，不重新加载数据
4. **内存管理**：分析完成后保持结果在内存中，避免重复计算

---

## 后续改进建议

1. **服务器端缓存**：将关卡分析结果缓存到服务器，减少客户端计算
2. **WebWorker**：将关卡分析移到WebWorker，避免阻塞主线程
3. **分页加载**：对于大量关卡，实现分页加载和分析
4. **数据压缩**：压缩关卡数据传输，提高加载速度

---

## 文件修改列表

- ✅ `/app/web/public/src/scripts/wordFrequency.js`（完全重写）

---

## 总结

✅ **问题1已解决**：Related forms现在可以正确解析，词频覆盖率大幅提升

✅ **问题2已解决**：Web版现在拥有与Electron版相同的关卡统计功能

🎉 **用户体验提升**：
- 更准确的词频识别（包含词形变化）
- 完整的单词使用历史追踪
- 智能的新单词标识
- 动态的统计范围调整

