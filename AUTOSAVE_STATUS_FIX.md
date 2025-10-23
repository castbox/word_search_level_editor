# 自动保存状态追踪修复文档

## 问题描述

用户反馈：
1. **保存后返回**：应该不提示，但实际效果正确 ✓
2. **未保存时返回**：应该提示，但实际**没有提示** ✗

根本原因：`autoSaveManager` 没有被正确启动，导致无法监听编辑事件，`hasUnsavedChanges` 一直保持 `false`。

## 修复方案

### 1. 在进入编辑器时启动自动保存管理器

**文件**: `app/web/public/src/scripts/navigation.js`

**修改位置**: `navigateTo` 方法（第646-693行）

```javascript
// 导航到指定页面
navigateTo(pageId) {
  // ... 其他代码
  
  // 如果离开编辑器页面，停止自动保存管理器
  if (this.currentPage === 'editor' && pageId !== 'editor') {
    if (window.autoSaveManager) {
      window.autoSaveManager.stop();
      console.log('⏸️ 离开编辑器，停止自动保存管理器');
    }
  }
  
  // ... 页面切换逻辑
  
  // 如果进入编辑器页面，启动自动保存管理器
  if (pageId === 'editor') {
    if (window.autoSaveManager) {
      window.autoSaveManager.start();
      // 重置为已保存状态（因为刚加载关卡）
      window.autoSaveManager.markAsSaved();
      console.log('🚀 进入编辑器，启动自动保存管理器');
    }
  }
}
```

**作用**:
- 进入编辑器页面时：启动监听器，重置为已保存状态
- 离开编辑器页面时：停止监听器，释放资源

### 2. 在加载关卡后重置保存状态

**文件**: `app/web/public/src/scripts/app.js`

**修改位置1**: `loadLevelIntoEditor` 函数末尾（第1276-1280行）

```javascript
console.log('关卡加载完成');

// 重置自动保存状态（因为刚加载的关卡是已保存状态）
if (window.autoSaveManager) {
  window.autoSaveManager.markAsSaved();
  console.log('✅ 已重置自动保存状态为"已保存"');
}
```

**作用**:
- 从关卡列表加载关卡后，重置为已保存状态
- 在编辑器内切换关卡（上一关/下一关）后，重置为已保存状态

**修改位置2**: DOMContentLoaded 时创建实例（第296-300行）

```javascript
// 初始化自动保存管理器（不自动启动，由 navigateTo 方法控制）
if (typeof AutoSaveManager !== 'undefined') {
  window.autoSaveManager = new AutoSaveManager();
  console.log('✅ 自动保存管理器已创建（等待进入编辑器页面时启动）');
}
```

**作用**:
- 页面加载时创建管理器实例，但不启动
- 避免在非编辑器页面运行无用的监听器

## 工作流程

### 场景1: 从关卡列表加载并编辑

```
1. 用户在关卡列表点击"编辑" 
   └─> 调用 navigation.navigateTo('editor')
       └─> autoSaveManager.start() ✓
       └─> autoSaveManager.markAsSaved() (hasUnsavedChanges = false) ✓
   
2. 用户修改网格或单词列表
   └─> 触发 'wordGridChanged' 或 MutationObserver
       └─> autoSaveManager.markAsUnsaved() (hasUnsavedChanges = true) ✓
   
3. 用户点击"保存关卡"
   └─> 保存成功后调用 autoSaveManager.onManualSave()
       └─> hasUnsavedChanges = false ✓
   
4. 用户点击"返回"
   └─> 检查 hasUnsavedChanges === false
   └─> 直接返回，不显示提示 ✓
```

### 场景2: 编辑但未保存

```
1. 用户在关卡列表点击"编辑"
   └─> autoSaveManager.start() ✓
   └─> hasUnsavedChanges = false ✓
   
2. 用户修改网格
   └─> hasUnsavedChanges = true ✓
   
3. 用户点击"返回"（未保存）
   └─> 检查 hasUnsavedChanges === true
   └─> 显示确认对话框："返回将丢失当前未保存的编辑内容，是否继续？" ✓
   
4a. 用户点击"取消"
    └─> 留在编辑器页面，继续编辑 ✓
    
4b. 用户点击"确定"
    └─> 返回关卡列表，丢弃更改 ✓
```

### 场景3: 自动保存后返回

```
1. 用户编辑关卡
   └─> hasUnsavedChanges = true ✓
   
2. 等待3分钟，自动保存触发
   └─> performAutoSave() 执行
   └─> 保存成功后 hasUnsavedChanges = false ✓
   
3. 用户点击"返回"
   └─> 检查 hasUnsavedChanges === false
   └─> 直接返回，不显示提示 ✓
```

### 场景4: 在编辑器内切换关卡

```
1. 用户在编辑器中点击"下一关"
   └─> levelNavigationManager.navigateToNextLevel()
       └─> loadLevelIntoEditor(targetLevel)
           └─> autoSaveManager.markAsSaved() ✓
           └─> hasUnsavedChanges = false ✓
   
2. 新关卡加载完成，处于已保存状态 ✓
```

## 自动保存管理器的监听事件

### 触发 `markAsUnsaved()` 的事件：

1. **网格变化**: `document.addEventListener('wordGridChanged')`
   - 在网格中添加/删除/修改字母时触发

2. **单词列表变化**: `MutationObserver` 监听 `#word-list`
   - 添加/删除/修改单词时触发

3. **标题输入**: `#edit-level-title` 的 `input` 事件
   - 修改关卡标题时触发

4. **等级输入**: `#edit-level-number` 的 `input` 事件
   - 修改关卡等级时触发

## 控制台日志说明

### 正常流程的日志：

```
✅ 自动保存管理器已创建（等待进入编辑器页面时启动）
正在导航到页面: editor
🚀 进入编辑器，启动自动保存管理器
🔄 启动自动保存（每3分钟）
✅ 已重置自动保存状态为"已保存"
关卡加载完成
```

### 编辑后的日志：

```
(用户修改网格或单词)
markAsUnsaved 被调用，hasUnsavedChanges = true
```

### 保存后的日志：

```
(用户点击保存)
保存结果: {success: true, ...}
✅ 手动保存完成，清除草稿
```

### 返回时的日志：

```
(用户点击返回)
checking hasUnsavedChanges: false
(直接返回，无提示)

或

checking hasUnsavedChanges: true
(显示确认对话框)
```

## 验证步骤

### 测试1: 保存后返回（应该不提示）

1. 访问 `http://localhost:3000` 并登录
2. 进入关卡列表，点击任意关卡的"编辑"按钮
3. 打开浏览器控制台（F12）
4. 观察日志：应该看到 "🚀 进入编辑器，启动自动保存管理器"
5. 做一些修改（添加单词或修改网格）
6. 观察日志：应该看到 hasUnsavedChanges 变化
7. 点击"保存关卡"按钮
8. 观察日志：应该看到 "✅ 手动保存完成，清除草稿"
9. 点击"返回"按钮
10. **预期结果**: 直接返回关卡列表，不显示确认对话框 ✓

### 测试2: 未保存时返回（应该提示）

1. 从关卡列表打开一个关卡
2. 做一些修改（添加单词或修改网格）
3. **不要点击保存**
4. 点击"返回"按钮
5. **预期结果**: 显示确认对话框 "返回将丢失当前未保存的编辑内容，是否继续？" ✓
6. 点击"取消"，应该留在编辑器页面
7. 再次点击"返回"，再次点击"确定"，应该返回关卡列表

### 测试3: 自动保存后返回（应该不提示）

1. 从关卡列表打开一个关卡
2. 做一些修改
3. 等待3分钟，观察控制台
4. 应该看到 "💾 执行自动保存..." 和 "✅ 自动保存成功"
5. 点击"返回"按钮
6. **预期结果**: 直接返回，不显示确认对话框 ✓

### 测试4: 编辑器内切换关卡

1. 从关卡列表打开一个关卡
2. 做一些修改（不保存）
3. 点击"下一关"按钮
4. 观察日志：应该看到 "✅ 已重置自动保存状态为"已保存""
5. 新关卡加载后，不做任何修改
6. 点击"返回"按钮
7. **预期结果**: 直接返回，不显示确认对话框 ✓

## 相关文件

- `/app/web/public/src/scripts/navigation.js` - 页面导航和自动保存管理器的启动/停止
- `/app/web/public/src/scripts/app.js` - 关卡加载和保存逻辑
- `/app/web/public/src/scripts/autosave.js` - 自动保存管理器类

## 技术细节

### autoSaveManager.start() 的防重复机制

```javascript
start() {
  if (this.autoSaveInterval) {
    console.log('⚠️ 自动保存已在运行');
    return; // 避免重复启动
  }
  // ... 启动逻辑
}
```

### 状态重置的两个时机

1. **进入编辑器页面时**: `navigateTo('editor')` → `markAsSaved()`
   - 无论是新建关卡还是加载关卡，都需要重置
   
2. **加载关卡数据后**: `loadLevelIntoEditor()` → `markAsSaved()`
   - 处理在编辑器内切换关卡的情况

### 为什么需要两次重置？

- `navigateTo` 在页面切换时调用，但如果已经在编辑器页面，再切换关卡时不会调用
- `loadLevelIntoEditor` 在加载关卡数据时调用，包括在编辑器内切换关卡
- 两者配合确保所有场景都能正确重置状态

## 总结

通过这次修复：

1. ✅ **自动保存管理器正确启动**：在进入编辑器页面时启动，离开时停止
2. ✅ **状态追踪准确**：能够正确识别用户是否有未保存的更改
3. ✅ **用户体验优化**：只在真正需要时显示确认提示
4. ✅ **资源管理优化**：只在编辑器页面运行监听器，其他页面停止

修复后的系统能够准确判断关卡的保存状态，大大改善了用户体验！

