# 🔧 关卡列表排序修复

## 📊 问题描述

### 原有问题
1. ❌ 排序下拉菜单显示"创建时间"，但实际按保存时间排序
2. ❌ 关卡列表显示"创建于"，不符合实际使用习惯
3. ❌ 排序字段名（`createdAt`）与实际使用的字段（`_lastModified`）不一致

### 用户期望
- ✅ 按关卡**最后一次保存的时间**排序
- ✅ 显示**最后保存时间**而不是创建时间
- ✅ 排序逻辑与显示内容保持一致

---

## ✅ 已实施的修复

### 1. 修改默认排序字段

**文件：** `app/web/public/src/scripts/navigation.js`

```javascript
// 修改前
this.sortConfig = {
  field: 'createdAt', // 默认按创建时间排序
  order: 'desc'
};

// 修改后
this.sortConfig = {
  field: 'lastModified', // 默认按最后保存时间排序
  order: 'desc'
};
```

### 2. 修复排序逻辑

**文件：** `app/web/public/src/scripts/navigation.js`

```javascript
// 修改前
} else if (field === 'createdAt') {
  // 直接使用文件系统时间进行排序
  valueA = a._lastModified ? new Date(a._lastModified).getTime() : 0;
  valueB = b._lastModified ? new Date(b._lastModified).getTime() : 0;
}

// 修改后
} else if (field === 'lastModified') {
  // 按最后保存时间排序：优先使用lastModifiedAt，然后_lastModified
  const timeA = a.lastModifiedAt || a._lastModified;
  const timeB = b.lastModifiedAt || b._lastModified;
  valueA = timeA ? new Date(timeA).getTime() : 0;
  valueB = timeB ? new Date(timeB).getTime() : 0;
}
```

**关键改进：**
- 字段名从 `createdAt` 改为 `lastModified`
- 优先使用 `lastModifiedAt`（保存时间），其次才用 `_lastModified`（文件修改时间）
- 逻辑更清晰，与字段名一致

### 3. 修改显示文本

**文件：** `app/web/public/src/scripts/navigation.js`

```javascript
// 修改前
// 创建时间 - 优先使用createdAt，然后使用_lastModified
const timeField = levelData.createdAt || levelData.lastModifiedAt || levelData._lastModified;
if (timeField) {
  const date = new Date(timeField);
  metaDiv.textContent = `创建于: ${date.toLocaleString()}`;
}

// 修改后
// 最后保存时间 - 优先使用lastModifiedAt或_lastModified
const timeField = levelData.lastModifiedAt || levelData._lastModified || levelData.createdAt;
if (timeField) {
  const date = new Date(timeField);
  metaDiv.textContent = `最后保存: ${date.toLocaleString()}`;
}
```

**关键改进：**
- 显示文本从"创建于"改为"**最后保存**"
- 优先级调整：`lastModifiedAt` > `_lastModified` > `createdAt`
- 更符合用户使用习惯

### 4. 更新下拉菜单选项

**文件：** `app/web/public/index.html`

```html
<!-- 修改前 -->
<select id="level-sort-select" class="sort-dropdown">
  <option value="date-desc">创建时间 ↓</option>
  <option value="date-asc">创建时间 ↑</option>
  <option value="level-asc">Level ↑</option>
  <option value="level-desc">Level ↓</option>
</select>

<!-- 修改后 -->
<select id="level-sort-select" class="sort-dropdown">
  <option value="lastModified-desc">保存时间 ↓</option>
  <option value="lastModified-asc">保存时间 ↑</option>
  <option value="level-asc">Level ↑</option>
  <option value="level-desc">Level ↓</option>
</select>
```

**关键改进：**
- 选项值从 `date-desc/asc` 改为 `lastModified-desc/asc`
- 显示文本从"创建时间"改为"**保存时间**"
- 与后端逻辑完全匹配

---

## 🔍 时间字段说明

### 数据来源

关卡数据中可能包含以下时间字段：

| 字段名 | 来源 | 含义 | 优先级 |
|-------|------|------|--------|
| `lastModifiedAt` | 服务器 | 关卡最后保存时间 | ⭐⭐⭐ 最高 |
| `_lastModified` | 文件系统 | 文件最后修改时间 | ⭐⭐ 次之 |
| `createdAt` | 元数据 | 关卡首次创建时间 | ⭐ 最低 |

### 优先级逻辑

```javascript
// 显示和排序都按照这个优先级
const time = levelData.lastModifiedAt    // 1. 优先：保存时间
           || levelData._lastModified    // 2. 其次：文件修改时间
           || levelData.createdAt;        // 3. 最后：创建时间
```

**为什么这样设计？**

1. **lastModifiedAt** - 最准确
   - 每次手动保存时由服务器记录
   - 反映了用户最后编辑的时间
   - 是最可靠的时间戳

2. **_lastModified** - 文件系统时间
   - 文件最后被修改的时间
   - 适用于没有 lastModifiedAt 的旧关卡
   - 作为备选方案

3. **createdAt** - 创建时间
   - 关卡首次创建的时间
   - 仅在其他时间字段都不存在时使用
   - 保底方案

---

## 📋 效果对比

### 关卡列表显示

**修改前：**
```
关卡标题
创建于: 2025-10-20 10:30:00 | 大小: 8x9 | ...
```

**修改后：**
```
关卡标题
最后保存: 2025-10-23 14:25:30 | 大小: 8x9 | ...
```

### 排序下拉菜单

**修改前：**
```
排序: [创建时间 ↓]
      创建时间 ↑
      Level ↑
      Level ↓
```

**修改后：**
```
排序: [保存时间 ↓]
      保存时间 ↑
      Level ↑
      Level ↓
```

### 排序行为

**场景：** 用户修改了一个旧关卡并保存

**修改前（错误）：**
- 关卡仍然显示在列表底部（按创建时间）
- 用户难以找到刚刚编辑的关卡

**修改后（正确）：**
- 关卡自动移动到列表顶部（按保存时间）
- 最近编辑的关卡一目了然

---

## 🎯 使用场景

### 场景1：查找最近编辑的关卡

1. 打开关卡库页面
2. 默认按"保存时间 ↓"排序
3. 最近编辑的关卡显示在最上面
4. ✅ 方便快速找到正在工作的关卡

### 场景2：按关卡等级浏览

1. 点击排序下拉菜单
2. 选择"Level ↑"
3. 关卡按等级从小到大排列
4. ✅ 方便按顺序查看关卡

### 场景3：查看编辑历史

1. 每个关卡显示"最后保存"时间
2. 一眼就能看出哪些关卡最近修改过
3. ✅ 便于管理和追踪进度

---

## 🧪 测试验证

### 测试1：排序功能

1. 打开关卡库：http://localhost:3000
2. 编辑一个关卡并保存
3. 返回关卡库
4. **预期：** 刚编辑的关卡显示在最上面

### 测试2：显示内容

1. 查看关卡列表中的时间信息
2. **预期：** 显示"最后保存: xxx"
3. **预期：** 时间是该关卡最后一次保存的时间

### 测试3：下拉菜单

1. 点击"排序"下拉菜单
2. **预期：** 显示"保存时间 ↓"和"保存时间 ↑"
3. 切换到"保存时间 ↑"
4. **预期：** 关卡按保存时间从旧到新排列

### 测试4：切换排序

```
选择"保存时间 ↓" → 最新保存的在上面
选择"保存时间 ↑" → 最旧保存的在上面
选择"Level ↑"    → 关卡等级从小到大
选择"Level ↓"    → 关卡等级从大到小
```

---

## 🔧 控制台验证

在浏览器控制台运行：

```javascript
// 检查排序配置
console.log('当前排序:', window.navigation.sortConfig);
// 应该显示: { field: 'lastModified', order: 'desc' }

// 检查关卡数据
const levels = window.navigation.levelsData;
console.log('关卡数量:', levels.length);
console.log('第一个关卡的时间字段:', {
  lastModifiedAt: levels[0].lastModifiedAt,
  _lastModified: levels[0]._lastModified,
  createdAt: levels[0].createdAt
});
```

---

## 📝 修改文件列表

- ✅ `app/web/public/src/scripts/navigation.js` - 修改排序和显示逻辑
- ✅ `app/web/public/index.html` - 更新下拉菜单选项

---

## ✅ 验收标准

- ✅ 默认按最后保存时间降序排列
- ✅ 关卡列表显示"最后保存"而不是"创建于"
- ✅ 下拉菜单显示"保存时间"而不是"创建时间"
- ✅ 排序功能正常工作
- ✅ 最近编辑的关卡显示在最上面
- ✅ 时间显示准确

---

## 🎉 总结

### 修复前的问题

1. ❌ 名称混乱（显示"创建时间"，实际按保存时间）
2. ❌ 时间不准确（优先级错误）
3. ❌ 用户体验差（找不到最近编辑的关卡）

### 修复后的改进

1. ✅ 名称统一（显示和实际都是"保存时间"）
2. ✅ 时间准确（使用lastModifiedAt优先）
3. ✅ 用户体验好（最近编辑的关卡在最上面）

**现在用户可以：**
- 快速找到最近编辑的关卡
- 清楚地看到每个关卡的最后保存时间
- 按照自己的需求灵活排序

一切都符合直觉和使用习惯！🎉

