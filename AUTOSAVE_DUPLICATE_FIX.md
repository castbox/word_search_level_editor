# 自动保存重复生成关卡修复文档

## 问题描述

自动保存功能会在关卡列表页面重复生成多个相同的关卡。

**严重程度**: 🔴 **严重** - 导致数据冗余和用户困惑

## 问题表现

用户操作流程：
1. 创建一个新关卡
2. 在编辑器中添加单词和网格
3. 等待3分钟，自动保存触发
4. 再等待3分钟，第二次自动保存触发
5. 返回关卡列表

**结果**: 关卡列表中出现2个（或更多）完全相同的关卡！

## 根本原因

### 问题代码

在 `autosave.js` 的 `performAutoSave()` 方法中：

```javascript
// 保存到服务器
const result = await window.electronAPI.saveLevel(levelData, window.currentLevelFilePath);

if (result.success) {
  this.lastSaveTime = Date.now();
  this.hasUnsavedChanges = false;
  this.showAutoSaveNotification('success');
  console.log('✅ 自动保存成功');
}
```

**问题**:
- 自动保存成功后，**没有保存 `result.filePath` 到 `window.currentLevelFilePath`**
- 这导致下次自动保存时，`currentLevelFilePath` 仍然是 `null` 或 `undefined`
- 服务器认为这是一个新关卡，生成新的文件

### 对比：手动保存的正确逻辑

在 `app.js` 的手动保存代码中（第646-649行）：

```javascript
// 如果是新创建的关卡，保存文件路径以便后续编辑
if (!window.currentLevelFilePath && result.filePath) {
  window.currentLevelFilePath = result.filePath;
  console.log('保存当前关卡路径:', window.currentLevelFilePath);
}
```

手动保存**正确地保存了文件路径**，所以不会重复生成关卡。

## 问题复现场景

### 场景1: 新建关卡后依赖自动保存

```
时间线：
00:00 - 用户创建新关卡，开始编辑
        window.currentLevelFilePath = null  ❌

03:00 - 第一次自动保存触发
        → saveLevel(levelData, null)
        → 服务器生成新文件: level_abc123.json
        → result.filePath = "level_abc123.json"
        → ❌ 但是没有保存到 window.currentLevelFilePath
        → window.currentLevelFilePath 仍然是 null  ❌

06:00 - 第二次自动保存触发
        → saveLevel(levelData, null)  ❌ 还是 null！
        → 服务器以为是新关卡，生成新文件: level_def456.json  ❌
        → 现在有2个相同的关卡了！

09:00 - 第三次自动保存触发
        → saveLevel(levelData, null)  ❌
        → 又生成新文件: level_ghi789.json  ❌
        → 现在有3个相同的关卡了！！！
```

### 场景2: 混合使用手动保存和自动保存

```
时间线：
00:00 - 用户创建新关卡
        window.currentLevelFilePath = null

03:00 - 第一次自动保存
        → 生成 level_abc123.json
        → ❌ 没有保存 filePath

04:00 - 用户手动保存
        → saveLevel(levelData, null)  ❌ 还是 null
        → 生成 level_def456.json  ❌
        → ✓ 这次保存了 filePath
        → window.currentLevelFilePath = "level_def456.json"

07:00 - 第二次自动保存
        → saveLevel(levelData, "level_def456.json")  ✓
        → 更新 level_def456.json  ✓
        → 不会再生成新文件

结果：关卡列表中有2个关卡（abc123 和 def456）
```

## 修复方案

在 `autosave.js` 的 `performAutoSave()` 方法中添加保存文件路径的逻辑：

```javascript
// 保存到服务器
const result = await window.electronAPI.saveLevel(levelData, window.currentLevelFilePath);

if (result.success) {
  // ✅ 如果是新创建的关卡，保存文件路径以便后续编辑
  if (!window.currentLevelFilePath && result.filePath) {
    window.currentLevelFilePath = result.filePath;
    console.log('💾 自动保存：首次保存，记录文件路径:', window.currentLevelFilePath);
  }
  
  this.lastSaveTime = Date.now();
  this.hasUnsavedChanges = false;
  this.showAutoSaveNotification('success');
  console.log('✅ 自动保存成功');
}
```

## 修复后的工作流程

### 正确的自动保存流程

```
时间线：
00:00 - 用户创建新关卡
        window.currentLevelFilePath = null

03:00 - 第一次自动保存触发
        → saveLevel(levelData, null)
        → 服务器生成新文件: level_abc123.json
        → result.filePath = "level_abc123.json"
        → ✅ 保存到 window.currentLevelFilePath
        → window.currentLevelFilePath = "level_abc123.json"  ✓

06:00 - 第二次自动保存触发
        → saveLevel(levelData, "level_abc123.json")  ✓
        → 服务器更新现有文件 level_abc123.json  ✓
        → 不会生成新文件  ✓

09:00 - 第三次自动保存触发
        → saveLevel(levelData, "level_abc123.json")  ✓
        → 继续更新同一个文件  ✓

结果：关卡列表中只有1个关卡  ✓
```

## 技术细节

### window.currentLevelFilePath 的作用

这个全局变量用于标识当前正在编辑的关卡文件：

- **`null` 或 `undefined`**: 表示这是一个新建关卡，没有对应的文件
- **有值**（如 `"level_abc123.json"`）: 表示正在编辑已存在的关卡

### 服务器端的处理逻辑

在 `server/server.js` 中：

```javascript
app.post('/api/levels', authManager.requireAuth('create'), async (req, res) => {
  const levelData = req.body;
  const overwriteFile = req.query.overwrite; // 从 currentLevelFilePath 传来
  
  if (overwriteFile) {
    // 更新现有文件
    await fs.writeFile(path.join(LEVELS_DIR, overwriteFile), JSON.stringify(levelData));
    return res.json({ success: true, filePath: overwriteFile });
  } else {
    // 生成新文件
    const newFileName = `level_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.json`;
    await fs.writeFile(path.join(LEVELS_DIR, newFileName), JSON.stringify(levelData));
    return res.json({ success: true, filePath: newFileName });
  }
});
```

如果 `overwriteFile` 参数存在，就更新文件；否则创建新文件。

### WebAPI 的调用

在 `webapi.js` 中：

```javascript
async saveLevel(levelData, currentFilePath = null) {
  // 构建查询参数
  const params = new URLSearchParams();
  if (currentFilePath && currentFilePath !== 'null') {
    params.append('overwrite', currentFilePath);
  }
  
  const response = await this.request(`/api/levels?${params}`, {
    method: 'POST',
    body: JSON.stringify(levelData)
  });
  
  return response;
}
```

如果 `currentFilePath` 有值，就添加 `overwrite` 参数。

## 防重复启动机制

自动保存管理器有防止重复启动的机制：

```javascript
start() {
  if (this.autoSaveInterval) {
    console.log('⚠️ 自动保存已在运行');
    return; // 如果已经启动，直接返回
  }
  
  // 启动定时器
  this.autoSaveInterval = setInterval(() => {
    this.performAutoSave();
  }, this.autoSaveFrequency);
}
```

这确保了不会有多个定时器同时运行。

## 验证步骤

### 测试1: 新建关卡的自动保存

1. 访问 `http://localhost:3000` 并登录
2. 创建一个新关卡，添加一些单词
3. 打开浏览器控制台（F12）
4. 等待3分钟，观察自动保存
5. **预期日志**:
   ```
   💾 执行自动保存...
   💾 自动保存：首次保存，记录文件路径: level_xxx.json  ✓
   ✅ 自动保存成功
   ```
6. 再等待3分钟，第二次自动保存
7. **预期日志**:
   ```
   💾 执行自动保存...
   ✅ 自动保存成功
   （不会再有"首次保存"的日志）
   ```
8. 返回关卡列表
9. **预期结果**: 只有1个关卡  ✓

### 测试2: 验证 currentLevelFilePath

在控制台中输入：

```javascript
console.log('当前关卡路径:', window.currentLevelFilePath);
```

**预期结果**:
- 新建关卡第一次自动保存前: `null`
- 第一次自动保存后: `"level_xxx.json"`  ✓
- 后续保存时: 保持不变  ✓

### 测试3: 清理重复的关卡

如果已经生成了重复的关卡：

1. 在关卡列表中，找出重复的关卡
2. 检查它们的创建时间（相差3分钟的倍数）
3. 保留最新的那个，删除旧的
4. 应用此修复后，不会再产生新的重复关卡

## 相关文件

- `/app/web/public/src/scripts/autosave.js` - 自动保存管理器（修复点）
- `/app/web/public/src/scripts/app.js` - 手动保存逻辑（参考）
- `/app/web/public/src/scripts/webapi.js` - API 接口封装
- `/server/server.js` - 服务器端保存逻辑

## 控制台日志对比

### 修复前（会生成重复关卡）

```
// 第一次自动保存
💾 执行自动保存...
✅ 自动保存成功
// ❌ 没有记录文件路径

// 第二次自动保存
💾 执行自动保存...
✅ 自动保存成功
// ❌ 又创建了新文件

// 第三次自动保存
💾 执行自动保存...
✅ 自动保存成功
// ❌ 又创建了新文件
```

### 修复后（只保存一个关卡）

```
// 第一次自动保存
💾 执行自动保存...
💾 自动保存：首次保存，记录文件路径: level_abc123.json  ✓
✅ 自动保存成功

// 第二次自动保存
💾 执行自动保存...
✅ 自动保存成功
// ✓ 更新现有文件，不创建新文件

// 第三次自动保存
💾 执行自动保存...
✅ 自动保存成功
// ✓ 继续更新同一个文件
```

## 边界情况

### 情况1: 用户在第一次自动保存前手动保存

```
00:00 - 创建新关卡
01:00 - 用户手动保存
        → window.currentLevelFilePath = "level_abc.json"  ✓
03:00 - 第一次自动保存
        → saveLevel(levelData, "level_abc.json")  ✓
        → 更新 level_abc.json
        → if 条件不满足（currentLevelFilePath 已有值），不执行保存路径逻辑
```

### 情况2: 加载已有关卡后编辑

```
00:00 - 从关卡列表加载关卡
        → window.currentLevelFilePath = "level_abc.json"  ✓
03:00 - 自动保存
        → saveLevel(levelData, "level_abc.json")  ✓
        → 更新 level_abc.json
        → if 条件不满足，不执行保存路径逻辑
```

### 情况3: 在编辑器内部切换关卡

```
00:00 - 加载关卡1
        → window.currentLevelFilePath = "level_001.json"
01:00 - 点击"下一关"，加载关卡2
        → window.currentLevelFilePath = "level_002.json"  ✓
        → markAsSaved() 重置保存状态  ✓
04:00 - 自动保存（如果有修改）
        → saveLevel(levelData, "level_002.json")  ✓
        → 更新正确的文件
```

## 总结

这个bug是由于自动保存没有正确保存文件路径导致的。修复方法很简单：在自动保存成功后，检查并保存 `result.filePath` 到 `window.currentLevelFilePath`，这样后续的保存就会更新同一个文件，而不是创建新文件。

修复后：
- ✅ 不会再生成重复的关卡
- ✅ 自动保存和手动保存逻辑一致
- ✅ 正确追踪当前编辑的关卡文件

