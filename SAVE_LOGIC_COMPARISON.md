# 手动保存 vs 自动保存逻辑对比

## 保存文件路径的逻辑完全一致 ✓

### 手动保存（app.js 第646-649行）

```javascript
// 如果是新创建的关卡，保存文件路径以便后续编辑
if (!window.currentLevelFilePath && result.filePath) {
  window.currentLevelFilePath = result.filePath;
  console.log('保存当前关卡路径:', window.currentLevelFilePath);
}
```

### 自动保存（autosave.js 第89-93行）

```javascript
// 如果是新创建的关卡，保存文件路径以便后续编辑
if (!window.currentLevelFilePath && result.filePath) {
  window.currentLevelFilePath = result.filePath;
  console.log('💾 自动保存：首次保存，记录文件路径:', window.currentLevelFilePath);
}
```

## 逻辑完全相同

两者都执行相同的检查和操作：

1. ✅ 检查 `!window.currentLevelFilePath` - 确认这是新建关卡
2. ✅ 检查 `result.filePath` 存在 - 确认服务器返回了文件路径
3. ✅ 保存路径到 `window.currentLevelFilePath` - 记录文件路径供后续使用

## 保存结果对比

### 场景1: 纯手动保存

```
00:00 创建新关卡
      window.currentLevelFilePath = null

01:00 用户点击"保存关卡"（第1次）
      → saveLevel(levelData, null)
      → 生成 level_abc123.json
      → window.currentLevelFilePath = "level_abc123.json"  ✓

02:00 用户继续编辑后再次点击"保存关卡"（第2次）
      → saveLevel(levelData, "level_abc123.json")
      → 更新 level_abc123.json  ✓

03:00 用户继续编辑后再次点击"保存关卡"（第3次）
      → saveLevel(levelData, "level_abc123.json")
      → 继续更新 level_abc123.json  ✓

结果：始终只有1个关卡文件  ✓
```

### 场景2: 纯自动保存

```
00:00 创建新关卡
      window.currentLevelFilePath = null

03:00 第1次自动保存
      → saveLevel(levelData, null)
      → 生成 level_abc123.json
      → window.currentLevelFilePath = "level_abc123.json"  ✓

06:00 第2次自动保存
      → saveLevel(levelData, "level_abc123.json")
      → 更新 level_abc123.json  ✓

09:00 第3次自动保存
      → saveLevel(levelData, "level_abc123.json")
      → 继续更新 level_abc123.json  ✓

结果：始终只有1个关卡文件  ✓
```

### 场景3: 混合使用（先自动后手动）

```
00:00 创建新关卡
      window.currentLevelFilePath = null

03:00 第1次自动保存
      → saveLevel(levelData, null)
      → 生成 level_abc123.json
      → window.currentLevelFilePath = "level_abc123.json"  ✓

04:00 用户点击"保存关卡"
      → saveLevel(levelData, "level_abc123.json")
      → 更新 level_abc123.json  ✓
      → if 条件不满足（currentLevelFilePath 已有值），不重复保存路径

06:00 第2次自动保存
      → saveLevel(levelData, "level_abc123.json")
      → 继续更新 level_abc123.json  ✓

结果：始终只有1个关卡文件  ✓
```

### 场景4: 混合使用（先手动后自动）

```
00:00 创建新关卡
      window.currentLevelFilePath = null

01:00 用户点击"保存关卡"
      → saveLevel(levelData, null)
      → 生成 level_abc123.json
      → window.currentLevelFilePath = "level_abc123.json"  ✓

03:00 第1次自动保存
      → saveLevel(levelData, "level_abc123.json")
      → 更新 level_abc123.json  ✓
      → if 条件不满足（currentLevelFilePath 已有值），不重复保存路径

06:00 第2次自动保存
      → saveLevel(levelData, "level_abc123.json")
      → 继续更新 level_abc123.json  ✓

结果：始终只有1个关卡文件  ✓
```

### 场景5: 快速连续保存

```
00:00 创建新关卡
      window.currentLevelFilePath = null

01:00 用户点击"保存关卡"
      → saveLevel(levelData, null)
      → 生成 level_abc123.json
      → window.currentLevelFilePath = "level_abc123.json"  ✓

01:05 用户立即再次点击"保存关卡"（5秒后）
      → saveLevel(levelData, "level_abc123.json")
      → 更新 level_abc123.json  ✓

01:10 用户又点击"保存关卡"（5秒后）
      → saveLevel(levelData, "level_abc123.json")
      → 继续更新 level_abc123.json  ✓

结果：始终只有1个关卡文件  ✓
```

## 关键保障机制

### 1. 条件检查的严谨性

```javascript
if (!window.currentLevelFilePath && result.filePath)
```

这个条件确保：
- ✅ 只在**第一次**保存时记录文件路径
- ✅ 后续保存不会重复执行（因为 `currentLevelFilePath` 已有值）
- ✅ 避免覆盖已有的文件路径

### 2. 服务器端的判断

```javascript
// server.js
if (overwriteFile) {
  // 更新现有文件
  await fs.writeFile(path.join(LEVELS_DIR, overwriteFile), ...);
} else {
  // 创建新文件
  const newFileName = `level_${timestamp}.json`;
  await fs.writeFile(path.join(LEVELS_DIR, newFileName), ...);
}
```

服务器根据 `overwriteFile` 参数决定是更新还是创建：
- `overwriteFile` 有值 → 更新现有文件
- `overwriteFile` 为空 → 创建新文件

### 3. 状态同步

无论手动保存还是自动保存，都会：
1. ✅ 检查 `window.currentLevelFilePath`
2. ✅ 调用相同的 API：`window.electronAPI.saveLevel(levelData, currentFilePath)`
3. ✅ 更新相同的全局变量：`window.currentLevelFilePath`
4. ✅ 服务器使用相同的逻辑处理请求

## 控制台日志对比

### 手动保存日志

```
// 第1次保存（新建）
保存按钮被点击
准备保存关卡数据...
正在覆盖已有关卡: null  或  新建关卡，生成ID: WSABC123
保存结果: {success: true, filePath: "level_xxx.json"}
保存当前关卡路径: level_xxx.json  ✓

// 第2次保存（更新）
保存按钮被点击
准备保存关卡数据...
正在覆盖已有关卡: level_xxx.json  ✓
保存结果: {success: true, filePath: "level_xxx.json"}
（if 条件不满足，不再记录路径）
```

### 自动保存日志

```
// 第1次自动保存（新建）
💾 执行自动保存...
💾 自动保存：首次保存，记录文件路径: level_xxx.json  ✓
✅ 自动保存成功

// 第2次自动保存（更新）
💾 执行自动保存...
✅ 自动保存成功
（if 条件不满足，不再记录路径）
```

## 验证测试

### 测试1: 纯手动保存

1. 创建新关卡
2. 添加单词
3. 点击"保存关卡"
4. 继续编辑
5. 再次点击"保存关卡"
6. 重复3-5步骤多次
7. 返回关卡列表

**预期**: 只有1个关卡  ✓

### 测试2: 纯自动保存

1. 创建新关卡
2. 添加单词
3. 等待3分钟（第1次自动保存）
4. 继续编辑
5. 等待3分钟（第2次自动保存）
6. 继续编辑
7. 等待3分钟（第3次自动保存）
8. 返回关卡列表

**预期**: 只有1个关卡  ✓

### 测试3: 混合保存

1. 创建新关卡
2. 添加单词
3. 等待2分钟
4. 点击"保存关卡"（手动保存）
5. 继续编辑
6. 等待3分钟（自动保存）
7. 继续编辑
8. 点击"保存关卡"（手动保存）
9. 返回关卡列表

**预期**: 只有1个关卡  ✓

### 测试4: 验证文件路径追踪

在每次保存后，在控制台输入：

```javascript
console.log('当前关卡路径:', window.currentLevelFilePath);
```

**预期**:
- 第1次保存前: `null`
- 第1次保存后: `"level_xxx.json"`
- 后续保存: 保持相同的值 `"level_xxx.json"`  ✓

## 总结

✅ **手动保存和自动保存的逻辑完全一致**

✅ **无论使用哪种保存方式，都只会创建1个关卡文件**

✅ **两种方式可以混合使用，不会产生冲突**

✅ **修复后的自动保存与手动保存完全兼容**

你可以放心使用任何保存方式，不会出现重复关卡的问题！

