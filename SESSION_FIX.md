# 🔧 会话超时问题修复方案

## 📊 问题总结

### 原有问题
1. ❌ 会话超时时间2小时（7200000毫秒）
2. ❌ 没有自动保存功能
3. ❌ 没有会话即将过期的警告
4. ❌ 会话过期后编辑内容丢失
5. ❌ 没有草稿保存机制

---

## ✅ 已实施的解决方案

### 1. 延长会话超时时间

**修改文件：** `config/auth-config.json`

```javascript
// 从2小时延长到8小时
"sessionTimeout": 28800000  // 8小时 = 28,800,000毫秒
```

**效果：**
- ✅ 用户可以连续工作8小时而不会断开
- ✅ 会话每次请求自动刷新
- ✅ 大幅减少会话过期的概率

---

### 2. 添加自动保存功能

**新增文件：** `app/web/public/src/scripts/autosave.js`

#### 核心功能

**🔄 自动保存**
- 每3分钟自动保存一次
- 只在有未保存更改时执行
- 保存失败自动转存草稿

**⏰ 会话监控**
- 每分钟检查会话状态
- 会话过期前10分钟警告
- 自动保存草稿防止数据丢失

**💾 草稿保存**
- 会话过期时自动保存到localStorage
- 页面关闭前自动保存草稿
- 下次打开时可恢复草稿

**👁️ 变更追踪**
- 监听网格变化
- 监听单词列表变化
- 监听输入框变化

---

### 3. 初始化自动保存

**修改文件：** `app/web/public/index.html`

添加了autosave.js的引用：
```html
<script src="src/scripts/autosave.js"></script>
```

---

## 🚀 如何启用自动保存

### 方法1：在navigation.js中自动启动（推荐）

在进入编辑器页面时自动启动：

```javascript
// 在 navigation.js 中的适当位置添加
if (!window.autoSaveManager) {
  window.autoSaveManager = new AutoSaveManager();
}

// 进入编辑器页面时启动
window.autoSaveManager.start();
```

### 方法2：手动启动

在浏览器控制台手动启动：

```javascript
// 创建实例
window.autoSaveManager = new AutoSaveManager();

// 启动自动保存
window.autoSaveManager.start();
```

---

## 💡 使用说明

### 自动保存功能

**自动保存时机：**
- ✅ 每3分钟自动保存一次
- ✅ 只在有未保存更改时保存
- ✅ 手动保存后重置计时器

**保存成功提示：**
```
右下角显示：✓ 自动保存成功
```

**保存失败处理：**
```
右下角显示：✗ 自动保存失败
同时保存草稿到本地存储
```

### 会话警告

**警告时机：**
- 会话剩余时间 < 10分钟时

**警告样式：**
```
━━━━━━━━━━━━━━━━━━━━━━━━
⏰ 会话即将过期
您的会话将在 X 分钟后过期
请及时保存工作
━━━━━━━━━━━━━━━━━━━━━━━━
[知道了]
```

### 草稿保存

**自动保存草稿：**
- 会话过期时
- 页面关闭前
- 自动保存失败时

**恢复草稿：**
```javascript
// 检查是否有草稿
const draft = window.autoSaveManager.restoreDraft();
if (draft) {
  console.log('发现草稿:', draft._draftSavedAt);
  // 提示用户是否恢复
}
```

**清除草稿：**
```javascript
window.autoSaveManager.clearDraft();
```

---

## 🎛️ 配置选项

可以通过修改 `autosave.js` 调整参数：

```javascript
class AutoSaveManager {
  constructor() {
    // 自动保存间隔（默认3分钟）
    this.autoSaveFrequency = 3 * 60 * 1000;
    
    // 会话警告阈值（默认10分钟）
    this.sessionWarningThreshold = 10 * 60 * 1000;
    
    // 是否启用自动保存（默认true）
    this.autoSaveEnabled = true;
  }
}
```

### 调整自动保存频率

**改为1分钟一次：**
```javascript
this.autoSaveFrequency = 1 * 60 * 1000;
```

**改为5分钟一次：**
```javascript
this.autoSaveFrequency = 5 * 60 * 1000;
```

### 调整警告时间

**改为5分钟警告：**
```javascript
this.sessionWarningThreshold = 5 * 60 * 1000;
```

**改为15分钟警告：**
```javascript
this.sessionWarningThreshold = 15 * 60 * 1000;
```

---

## 🔌 API说明

### 公共方法

```javascript
// 启动自动保存
window.autoSaveManager.start();

// 停止自动保存
window.autoSaveManager.stop();

// 手动触发保存
window.autoSaveManager.performAutoSave();

// 标记有未保存的更改
window.autoSaveManager.markAsUnsaved();

// 标记为已保存
window.autoSaveManager.markAsSaved();

// 保存草稿
window.autoSaveManager.saveDraftToLocalStorage();

// 恢复草稿
const draft = window.autoSaveManager.restoreDraft();

// 清除草稿
window.autoSaveManager.clearDraft();

// 手动保存后调用（清除草稿）
window.autoSaveManager.onManualSave();
```

### 事件监听

自动保存管理器会自动监听：
- ✅ 网格变化（wordGridChanged事件）
- ✅ 单词列表变化（MutationObserver）
- ✅ 输入框变化（input事件）
- ✅ 页面关闭（beforeunload事件）

---

## 🧪 测试步骤

### 测试1：自动保存功能

1. 启动服务器并登录
2. 进入编辑器页面
3. 打开控制台，启动自动保存：
   ```javascript
   window.autoSaveManager = new AutoSaveManager();
   window.autoSaveManager.start();
   ```
4. 添加一些单词或修改网格
5. 等待3分钟
6. 应该看到右下角提示：✓ 自动保存成功

### 测试2：会话警告

```javascript
// 手动触发会话警告测试
window.autoSaveManager.showSessionWarning(5);
```

应该看到橙色警告框：
```
⏰ 会话即将过期
您的会话将在 5 分钟后过期
请及时保存工作
```

### 测试3：草稿保存和恢复

1. 在编辑器中添加一些内容
2. 在控制台运行：
   ```javascript
   window.autoSaveManager.saveDraftToLocalStorage();
   ```
3. 刷新页面
4. 在控制台运行：
   ```javascript
   const draft = window.autoSaveManager.restoreDraft();
   console.log('草稿:', draft);
   ```
5. 应该看到之前保存的数据

### 测试4：页面关闭警告

1. 在编辑器中添加一些内容
2. 尝试关闭页面
3. 应该看到浏览器提示：
   ```
   您有未保存的更改，确定要离开吗？
   ```

---

## 📝 与现有代码集成

### 在保存按钮中调用

修改 `app.js` 中的保存逻辑：

```javascript
saveButton.addEventListener('click', async () => {
  // ... 现有保存逻辑 ...
  
  if (result.success) {
    showStatusMessage(`关卡已保存`, 'success');
    
    // 通知自动保存管理器
    if (window.autoSaveManager) {
      window.autoSaveManager.onManualSave();
    }
  }
});
```

### 在页面切换时处理

```javascript
// 进入编辑器页面
if (targetPage === 'editor') {
  if (window.autoSaveManager) {
    window.autoSaveManager.start();
    
    // 检查是否有草稿
    const draft = window.autoSaveManager.restoreDraft();
    if (draft) {
      if (confirm('发现未保存的草稿，是否恢复？')) {
        loadLevelIntoEditor(draft);
        window.autoSaveManager.clearDraft();
      }
    }
  }
}

// 离开编辑器页面
if (currentPage === 'editor') {
  if (window.autoSaveManager) {
    window.autoSaveManager.stop();
  }
}
```

---

## 🔄 完整的工作流程

```
用户进入编辑器
    ↓
启动自动保存管理器
    ↓
检查是否有草稿 → 是 → 提示恢复
    ↓              ↓
    否           恢复草稿
    ↓              ↓
开始编辑 ←────────┘
    ↓
监听变化（标记为未保存）
    ↓
每3分钟自动保存
    ↓
成功 → 标记为已保存
失败 → 保存到草稿
    ↓
每1分钟检查会话
    ↓
剩余<10分钟 → 显示警告
    ↓
手动保存 → 清除草稿
    ↓
离开页面 → 保存草稿
```

---

## 🎯 预期效果

### 用户体验提升

**之前：**
- ❌ 2小时后会话过期
- ❌ 编辑内容丢失
- ❌ 无提前警告
- ❌ 需要频繁手动保存

**现在：**
- ✅ 8小时会话时间
- ✅ 每3分钟自动保存
- ✅ 10分钟前警告
- ✅ 自动草稿保护
- ✅ 页面关闭前提示

### 数据安全性

- ✅ 多重保护机制
- ✅ 自动保存到服务器
- ✅ 失败时保存到本地
- ✅ 页面关闭前保存
- ✅ 会话过期前警告

---

## 🔧 故障排除

### 问题1：自动保存不工作

**检查：**
```javascript
console.log('自动保存管理器:', window.autoSaveManager);
console.log('是否运行:', !!window.autoSaveManager.autoSaveInterval);
console.log('是否启用:', window.autoSaveManager.autoSaveEnabled);
```

**解决：**
```javascript
// 手动启动
window.autoSaveManager.start();
```

### 问题2：会话仍然过期太快

**检查配置：**
```bash
grep sessionTimeout config/auth-config.json
```

**应该显示：**
```
"sessionTimeout": 28800000,
```

**如果不对：**
```bash
# 手动修改或重启服务器
```

### 问题3：草稿无法保存

**检查localStorage：**
```javascript
console.log('草稿:', localStorage.getItem('levelDraft'));
```

**清除并重试：**
```javascript
localStorage.removeItem('levelDraft');
window.autoSaveManager.saveDraftToLocalStorage();
```

---

## 📋 文件修改列表

- ✅ `config/auth-config.json` - 延长会话时间
- ✅ `app/web/public/src/scripts/autosave.js` - 新增自动保存功能
- ✅ `app/web/public/index.html` - 引入autosave.js

---

## 🚀 立即启用

### 简单启动（临时）

1. 打开编辑器
2. 按F12打开控制台
3. 运行：
   ```javascript
   window.autoSaveManager = new AutoSaveManager();
   window.autoSaveManager.start();
   ```

### 永久启用（推荐）

编辑 `app/web/public/src/scripts/navigation.js`，在适当位置添加：

```javascript
// 在DOMContentLoaded或页面加载时
if (!window.autoSaveManager) {
  window.autoSaveManager = new AutoSaveManager();
}

// 进入编辑器时
if (targetPage === 'editor') {
  window.autoSaveManager.start();
}
```

---

## 💡 总结

通过这次修复：
1. ✅ 会话时间延长4倍（2小时 → 8小时）
2. ✅ 新增自动保存功能（每3分钟）
3. ✅ 新增会话警告机制（10分钟前）
4. ✅ 新增草稿保护机制
5. ✅ 新增页面关闭提醒

**用户再也不用担心：**
- 会话突然过期
- 编辑内容丢失
- 忘记保存
- 意外关闭页面

一切都自动处理！🎉

