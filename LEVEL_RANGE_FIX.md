# 单词使用频率统计范围修复文档

## 问题描述

在查看单词使用频率时，统计范围一直显示 **"1-1"**，即使有很多关卡，统计范围也不会更新。

## 问题原因

在 `wordFrequency.js` 中：

1. `currentLevelNumber` 初始化为 `1`
2. 在 `mergeLevelData()` 函数中合并关卡后，没有更新 `currentLevelNumber` 为实际的最大关卡等级
3. 导致统计范围一直是 `1-1`

### 原代码：

```javascript
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
  // ❌ 没有更新 currentLevelNumber
}
```

## 修复方案

在 `mergeLevelData()` 函数中，合并关卡后自动计算最大关卡等级：

```javascript
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
  
  // ✅ 计算最大关卡等级作为统计范围
  if (this.levelAnalysis.mergedLevels.size > 0) {
    const maxLevel = Math.max(...this.levelAnalysis.mergedLevels.keys());
    this.levelAnalysis.currentLevelNumber = maxLevel;
    this.currentLevelNumber = maxLevel; // 保持兼容
    console.log(`自动设置统计范围为: 1-${maxLevel}`);
  }
  
  console.log(`合并完成，共 ${this.levelAnalysis.mergedLevels.size} 个关卡`);
}
```

## 修复逻辑

1. **合并关卡数据**：先合并所有正式关卡和编辑器关卡
2. **计算最大等级**：使用 `Math.max(...mergedLevels.keys())` 获取所有关卡中的最大等级
3. **更新统计范围**：将 `currentLevelNumber` 设置为最大等级
4. **保持兼容性**：同时更新 `this.currentLevelNumber` 以保持旧代码兼容

## 工作原理

### 示例场景

假设有以下关卡：

**正式关卡**:
- `data/levels/formal/lv1_500.json` 包含关卡 1-500

**编辑器关卡**:
- 用户创建了关卡 10, 15, 20

### 合并后的 Map：

```javascript
mergedLevels = Map {
  1 => { level: 1, words: [...], source: 'formal' },
  2 => { level: 2, words: [...], source: 'formal' },
  // ... 
  10 => { level: 10, words: [...], source: 'editor' },  // 覆盖正式关卡
  // ...
  15 => { level: 15, words: [...], source: 'editor' },  // 覆盖正式关卡
  // ...
  20 => { level: 20, words: [...], source: 'editor' },  // 覆盖正式关卡
  // ...
  500 => { level: 500, words: [...], source: 'formal' }
}
```

### 计算最大等级：

```javascript
const maxLevel = Math.max(...mergedLevels.keys());
// maxLevel = 500
```

### 统计范围显示：

```
统计范围: 关卡 1-500  ✓
```

## 统计逻辑

修复后，单词使用频率统计会：

1. **总使用次数**：统计单词在关卡 1 到最大等级中出现的次数
2. **近5关使用次数**：统计单词在最近5个关卡中出现的次数（相对于最大等级）
3. **首次出现**：如果单词只在最大等级关卡中出现，标记为"首次出现"

### 示例

假设最大等级是 **500**，查询单词 **"APPLE"**：

```javascript
// 统计范围：关卡 1-500

// APPLE 在以下关卡中出现：
- 关卡 10
- 关卡 20
- 关卡 495
- 关卡 498

// 结果：
totalCount: 4          // 在 1-500 范围内出现 4 次
recent5Count: 2        // 在 496-500 范围内出现 2 次
isFirstTime: false     // 不是首次出现（在 500 之前就出现过）
currentLevelRange: "1-500"  ✓  // 显示正确的范围
```

## 控制台日志

修复后，在浏览器控制台中会看到：

```
合并关卡数据...
关卡 10 使用编辑器版本覆盖正式版本
关卡 15 使用编辑器版本覆盖正式版本
关卡 20 使用编辑器版本覆盖正式版本
自动设置统计范围为: 1-500  ✓
合并完成，共 500 个关卡
分析单词使用情况（基于关卡 1-500）...
在范围内找到 500 个关卡进行统计
统计到 XXXX 个不同单词
关卡分析完成
```

## 验证步骤

### 测试1: 查看统计范围

1. 访问 `http://localhost:3000` 并登录
2. 进入关卡编辑器
3. 在单词列表中输入一个单词（如 "APPLE"）
4. 打开浏览器控制台（F12）
5. 点击单词旁边的"查看频率"按钮
6. **预期结果**：
   - 统计范围显示正确（如 "统计范围: 关卡 1-500"）✓
   - 不再显示 "1-1"

### 测试2: 验证控制台日志

1. 刷新页面（触发重新分析）
2. 在控制台中查找日志
3. **预期结果**：
   - 看到 "自动设置统计范围为: 1-XXX"
   - 看到 "分析单词使用情况（基于关卡 1-XXX）"
   - XXX 是实际的最大关卡等级

### 测试3: 验证单词统计

1. 输入一个常见单词（如 "TIME", "WORLD"）
2. 查看频率信息
3. **预期结果**：
   - 总使用次数 > 0
   - 近5关使用次数显示正确
   - 统计范围显示为 "1-500" 而不是 "1-1"

## 相关文件

- `/app/web/public/src/scripts/wordFrequency.js` - 词频分析和统计逻辑
- `/app/web/public/src/scripts/wordList.js` - 单词列表UI和频率信息显示

## 技术细节

### Map.keys() 返回的是迭代器

```javascript
// ❌ 错误：不能直接对迭代器使用 Math.max
const maxLevel = Math.max(this.levelAnalysis.mergedLevels.keys());

// ✓ 正确：使用展开运算符将迭代器转为数组
const maxLevel = Math.max(...this.levelAnalysis.mergedLevels.keys());
```

### 为什么同时更新两个变量？

```javascript
this.levelAnalysis.currentLevelNumber = maxLevel;  // 新版本使用
this.currentLevelNumber = maxLevel;                 // 旧版本兼容
```

- `this.levelAnalysis.currentLevelNumber` 是新的规范结构
- `this.currentLevelNumber` 是为了兼容旧代码（可能在其他地方被引用）

## 边界情况

### 情况1: 没有任何关卡

```javascript
if (this.levelAnalysis.mergedLevels.size > 0) {
  // 只有在有关卡时才计算
  const maxLevel = Math.max(...this.levelAnalysis.mergedLevels.keys());
  // ...
}
// 如果没有关卡，currentLevelNumber 保持初始值 1
```

### 情况2: 关卡编号不连续

```javascript
// 关卡: 1, 5, 10, 50, 100
maxLevel = 100  // 取最大值
// 统计范围: 1-100
// 但实际只统计存在的关卡：1, 5, 10, 50, 100
```

### 情况3: 只有编辑器关卡

```javascript
// 用户创建了关卡 10, 20, 30
// 没有正式关卡
maxLevel = 30
// 统计范围: 1-30
// 实际统计：10, 20, 30（1-9, 11-19, 21-29 没有数据）
```

## 总结

通过在 `mergeLevelData()` 中自动计算最大关卡等级，修复了统计范围始终显示 "1-1" 的问题。现在统计范围会正确显示为实际的关卡范围（如 "1-500"），让用户清楚地知道单词使用频率是基于多少个关卡统计的。

