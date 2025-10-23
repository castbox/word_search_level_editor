# 🧪 自动保存功能测试指南

## ✅ 服务器状态

```
✓ 服务器已重启 (PID: 85773)
✓ 新的会话超时时间: 8小时
✓ 监听端口: 3000
✓ 访问地址: http://localhost:3000
```

---

## 🚀 快速测试（5分钟）

### 步骤1：打开编辑器

1. 浏览器访问：http://localhost:3000
2. 登录（如需要）：yanyi / yanyi123
3. 点击"手动编辑关卡"

### 步骤2：启动自动保存

按 `F12` 打开控制台，运行：

```javascript
// 创建自动保存管理器
window.autoSaveManager = new AutoSaveManager();

// 启动自动保存
window.autoSaveManager.start();

// 验证启动成功
console.log('自动保存已启动:', !!window.autoSaveManager.autoSaveInterval);
```

**预期输出：**
```
✅ 自动保存管理器已初始化
🔄 启动自动保存（每3分钟）
自动保存已启动: true
```

### 步骤3：测试自动变更检测

在编辑器中进行任何操作：
- 添加一个单词（如 `CAT`）
- 修改网格
- 修改标题

然后检查：
```javascript
console.log('有未保存更改:', window.autoSaveManager.hasUnsavedChanges);
```

**预期：** `true`

### 步骤4：测试自动保存通知

手动触发一次自动保存（不用等3分钟）：

```javascript
window.autoSaveManager.performAutoSave();
```

**预期效果：**
- 右下角出现绿色提示：`✓ 自动保存成功`
- 控制台显示：`✅ 自动保存成功`

### 步骤5：测试会话警告

手动触发会话警告（模拟会话即将过期）：

```javascript
window.autoSaveManager.showSessionWarning(5);
```

**预期效果：**
- 右上角出现橙色警告框
- 显示："您的会话将在 5 分钟后过期"

### 步骤6：测试草稿保存

```javascript
// 保存草稿
window.autoSaveManager.saveDraftToLocalStorage();

// 检查草稿
const draft = window.autoSaveManager.restoreDraft();
console.log('草稿内容:', draft);
```

**预期效果：**
- 右下角显示：`💾 已保存到草稿`
- 控制台显示草稿数据

---

## 📊 完整测试场景

### 场景1：正常自动保存流程

1. 进入编辑器
2. 启动自动保存：
   ```javascript
   window.autoSaveManager = new AutoSaveManager();
   window.autoSaveManager.start();
   ```
3. 添加一些单词
4. 等待3分钟
5. 应该看到：`✓ 自动保存成功`

### 场景2：会话即将过期警告

1. 启动自动保存
2. 手动触发警告：
   ```javascript
   window.autoSaveManager.showSessionWarning(8);
   ```
3. 应该看到橙色警告框

### 场景3：草稿保存和恢复

1. 添加一些内容
2. 保存草稿：
   ```javascript
   window.autoSaveManager.saveDraftToLocalStorage();
   ```
3. 刷新页面
4. 恢复草稿：
   ```javascript
   window.autoSaveManager = new AutoSaveManager();
   const draft = window.autoSaveManager.restoreDraft();
   if (draft) {
     console.log('发现草稿:', draft.title, draft._draftSavedAt);
   }
   ```

### 场景4：页面关闭警告

1. 添加一些内容（不保存）
2. 尝试关闭页面
3. 应该看到浏览器提示："您有未保存的更改，确定要离开吗？"

---

## 🔧 调试命令

### 检查自动保存状态

```javascript
console.log({
  isRunning: !!window.autoSaveManager.autoSaveInterval,
  hasChanges: window.autoSaveManager.hasUnsavedChanges,
  lastSave: new Date(window.autoSaveManager.lastSaveTime),
  enabled: window.autoSaveManager.autoSaveEnabled
});
```

### 检查会话状态

```javascript
fetch('/api/auth/status', {
  headers: window.electronAPI.getHeaders()
})
.then(r => r.json())
.then(data => {
  if (data.expiresAt) {
    const remaining = data.expiresAt - Date.now();
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    console.log(`会话剩余时间: ${hours}小时 ${minutes}分钟`);
  }
});
```

### 强制触发自动保存

```javascript
// 立即执行一次自动保存
window.autoSaveManager.markAsUnsaved();
window.autoSaveManager.performAutoSave();
```

### 查看草稿

```javascript
const draft = localStorage.getItem('levelDraft');
if (draft) {
  const data = JSON.parse(draft);
  console.log('草稿信息:', {
    title: data.title,
    level: data.level,
    savedAt: data._draftSavedAt,
    words: data.wordList?.words?.length
  });
}
```

---

## 🎯 验收标准

### 必须通过的测试

- ✅ 自动保存管理器可以成功创建和启动
- ✅ 编辑操作会触发"未保存"标记
- ✅ 3分钟后自动保存成功
- ✅ 自动保存成功后显示通知
- ✅ 会话警告可以正确显示
- ✅ 草稿可以保存到localStorage
- ✅ 草稿可以成功恢复
- ✅ 页面关闭前有提示

### 可选的高级测试

- ⭕ 自动保存失败时转存草稿
- ⭕ 会话过期时自动保存草稿
- ⭕ 多次自动保存不冲突
- ⭕ 手动保存后清除草稿

---

## 🐛 已知问题和解决方案

### 问题1：自动保存管理器未定义

**症状：** `window.autoSaveManager is undefined`

**解决：**
```javascript
window.autoSaveManager = new AutoSaveManager();
window.autoSaveManager.start();
```

### 问题2：会话时间未更新

**检查：**
```bash
grep sessionTimeout config/auth-config.json
```

**应该显示：** `"sessionTimeout": 28800000`

**解决：** 重启服务器

### 问题3：localStorage被禁用

**检查：**
```javascript
try {
  localStorage.setItem('test', '1');
  localStorage.removeItem('test');
  console.log('✅ localStorage可用');
} catch(e) {
  console.error('❌ localStorage不可用:', e);
}
```

**解决：** 在浏览器设置中启用localStorage

---

## 📝 测试检查清单

```
□ 服务器成功启动
□ 可以访问 http://localhost:3000
□ 可以登录系统
□ 进入编辑器页面
□ 自动保存管理器创建成功
□ 自动保存成功启动
□ 变更检测工作正常
□ 自动保存通知显示
□ 会话警告可以显示
□ 草稿保存成功
□ 草稿恢复成功
□ 页面关闭有提示
```

---

## 🎉 测试通过后

如果所有测试通过，说明：
- ✅ 会话超时问题已解决（8小时）
- ✅ 自动保存功能正常工作
- ✅ 会话监控正常工作
- ✅ 草稿保护机制有效

可以进行：
1. 团队测试
2. 长时间使用测试
3. 部署到生产环境

---

## 💡 使用建议

### 日常使用

进入编辑器后立即启动自动保存：

```javascript
// 每次进入编辑器时运行
if (!window.autoSaveManager) {
  window.autoSaveManager = new AutoSaveManager();
  window.autoSaveManager.start();
}
```

### 长时间编辑

建议：
- 每小时手动保存一次
- 注意会话警告提示
- 离开前确认已保存

### 网络不稳定时

自动保存会自动处理失败情况：
- 失败时保存到草稿
- 恢复后继续自动保存
- 不会丢失数据

---

## 📞 需要帮助？

如果测试失败，提供：
1. 控制台错误信息
2. 浏览器版本
3. 操作系统版本
4. 具体失败的步骤

检查文件：
- `/Users/yan/Desktop/word_search_level_editor/SESSION_FIX.md`
- `/Users/yan/Desktop/word_search_level_editor/app/web/public/src/scripts/autosave.js`

