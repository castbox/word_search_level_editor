# 📝 词频功能验证指南

## 🚀 快速启动（3步）

### 方法1：最简单的启动方式

```bash
cd /Users/yan/Desktop/word_search_level_editor
node server/server.js
```

启动后访问：**http://localhost:3000**

---

### 方法2：使用启动脚本（推荐）

```bash
cd /Users/yan/Desktop/word_search_level_editor
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

启动后访问：**http://localhost:3000**

**默认登录账号：**
- 用户名：`yanyi`
- 密码：`yanyi123`

---

## ✅ 验证1：Related Forms 解析功能

### 步骤1：启动服务器
按照上面的方法启动服务器

### 步骤2：打开浏览器
访问 http://localhost:3000

### 步骤3：登录（如果需要）
使用 `yanyi` / `yanyi123` 登录

### 步骤4：进入编辑器
点击"手动编辑"进入关卡编辑器

### 步骤5：打开浏览器控制台
按 `F12` 或 `Cmd+Option+I` 打开开发者工具

### 步骤6：测试Related Forms
在控制台输入以下代码：

```javascript
// 测试1：查看CSV加载情况
console.log('词频Map大小:', window.wordFrequencyInstance.frequencyMap.size);

// 测试2：测试头词
console.log('HAVE:', window.wordFrequencyInstance.getWordRank('HAVE'));

// 测试3：测试Related forms（这些之前都是"未知"）
console.log('HAS:', window.wordFrequencyInstance.getWordRank('HAS'));
console.log('HAD:', window.wordFrequencyInstance.getWordRank('HAD'));
console.log('HAVING:', window.wordFrequencyInstance.getWordRank('HAVING'));

// 测试4：测试词频等级
console.log('HAS级别:', window.wordFrequencyInstance.getFrequencyLevel('HAS'));
console.log('HAD级别:', window.wordFrequencyInstance.getFrequencyLevel('HAD'));

// 测试5：更多例子
console.log('\n--- MAKE词族 ---');
console.log('MAKE:', window.wordFrequencyInstance.getWordRank('MAKE'));
console.log('MAKES:', window.wordFrequencyInstance.getWordRank('MAKES'));
console.log('MADE:', window.wordFrequencyInstance.getWordRank('MADE'));
console.log('MAKING:', window.wordFrequencyInstance.getWordRank('MAKING'));

console.log('\n--- BE词族 ---');
console.log('BE:', window.wordFrequencyInstance.getWordRank('BE'));
console.log('IS:', window.wordFrequencyInstance.getWordRank('IS'));
console.log('AM:', window.wordFrequencyInstance.getWordRank('AM'));
console.log('ARE:', window.wordFrequencyInstance.getWordRank('ARE'));
console.log('WAS:', window.wordFrequencyInstance.getWordRank('WAS'));
console.log('WERE:', window.wordFrequencyInstance.getWordRank('WERE'));
```

**预期结果：**
```
词频Map大小: 25000+ （应该比之前大很多）

HAVE: 1000
HAS: 1000   ✅（之前是null，现在应该显示1000）
HAD: 1000   ✅（之前是null，现在应该显示1000）
HAVING: 1000 ✅（之前是null，现在应该显示1000）

HAS级别: high
HAD级别: high

--- MAKE词族 ---
MAKE: 2000
MAKES: 2000  ✅
MADE: 2000   ✅
MAKING: 2000 ✅

--- BE词族 ---
BE: 1000
IS: 1000    ✅
AM: 1000    ✅
ARE: 1000   ✅
WAS: 1000   ✅
WERE: 1000  ✅
```

### 步骤7：UI验证
在编辑器的单词列表中：

1. **添加测试单词**：
   ```
   HAS
   HAD
   HAVING
   MAKES
   MADE
   IS
   WAS
   ```

2. **查看词频标签**：
   - 所有这些词现在应该显示为 `🟢 高频词` 或 `🟡 中频词`
   - 而不是 `⚪ 未知词`

3. **点击 `!` 按钮**：
   - 应该能看到完整的词频信息
   - 词频排名不再是"无数据"

---

## ✅ 验证2：关卡使用统计功能

### 步骤1：确认关卡数据已加载
在浏览器控制台输入：

```javascript
// 检查关卡分析状态
console.log('分析就绪:', window.wordFrequencyInstance.levelAnalysis.isAnalysisReady);
console.log('正式关卡数:', window.wordFrequencyInstance.levelAnalysis.formalLevels.size);
console.log('编辑器关卡数:', window.wordFrequencyInstance.levelAnalysis.editorLevels.size);
console.log('合并后关卡数:', window.wordFrequencyInstance.levelAnalysis.mergedLevels.size);
console.log('统计单词数:', window.wordFrequencyInstance.levelAnalysis.wordUsage.size);
```

**预期结果：**
```
分析就绪: true
正式关卡数: 500 （如果有lv1_500.json）
编辑器关卡数: X （您已保存的关卡数量）
合并后关卡数: 500+
统计单词数: 数千个
```

### 步骤2：设置当前关卡等级
在编辑器中，找到"关卡等级"输入框，设置为 `147`

### 步骤3：添加测试单词
添加一个单词，例如 `CAT`

### 步骤4：查看统计信息
观察单词列表中的 `CAT`：

**应该显示：**
```
CAT
├─ 📊 高频词 (800)        ← BNC-COCA词频
├─ 📈 3                    ← 使用次数（如果之前用过）
│  或
├─ ✨                      ← 新单词标识（如果首次使用）
└─ ! (点击查看详情)
```

### 步骤5：查看详细统计
点击单词旁边的 `!` 按钮

**应该显示模态框：**
```
━━━━━━━━━━━━━━━━━━━━
单词: CAT
━━━━━━━━━━━━━━━━━━━━

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

### 步骤6：测试动态范围
修改关卡等级为 `200`，观察统计范围是否更新为 `1-200`

### 步骤7：控制台验证
```javascript
// 测试单个单词统计
const catStats = window.wordFrequencyInstance.getWordLevelStats('CAT');
console.log('CAT统计:', catStats);

// 测试完整信息
const catInfo = window.wordFrequencyInstance.getCompleteWordInfo('CAT');
console.log('CAT完整信息:', catInfo);

// 测试新单词
const newWord = window.wordFrequencyInstance.getWordLevelStats('NEWWORD123');
console.log('新单词:', newWord);
console.log('是否首次使用:', newWord.isFirstTime);
```

---

## 🎨 UI视觉验证清单

在编辑器中添加这些测试单词，检查UI显示：

```javascript
// 测试集1：Related forms
HAS, HAD, HAVING    → 应该显示 🟢 高频词
MAKES, MADE, MAKING → 应该显示 🟢 高频词
IS, AM, ARE, WAS    → 应该显示 🟢 高频词

// 测试集2：不同频率等级
THE, BE, HAVE       → 🟢 高频词 (1k-3k)
EXAMPLE, SYSTEM     → 🟡 中频词 (4k-9k)
ALGORITHM, COMPLEX  → 🔴 低频词 (10k+)

// 测试集3：使用统计
（选择一些您之前关卡中用过的单词）
应该显示使用次数而不是✨
```

---

## 🐛 常见问题排查

### 问题1：显示"未知词"的词太多

**检查：**
```javascript
console.log('词频Map大小:', window.wordFrequencyInstance.frequencyMap.size);
// 应该 > 20000

console.log('是否加载:', window.wordFrequencyInstance.isLoaded);
// 应该是 true
```

**如果词频Map太小：**
- 检查 `/data/BNC_COCA.csv` 文件是否存在
- 查看控制台是否有错误信息
- 尝试刷新页面

### 问题2：关卡统计不显示

**检查：**
```javascript
console.log('分析就绪:', window.wordFrequencyInstance.levelAnalysis.isAnalysisReady);
// 应该是 true

console.log('合并关卡数:', window.wordFrequencyInstance.levelAnalysis.mergedLevels.size);
// 应该 > 0
```

**如果分析未就绪：**
- 等待几秒钟（可能还在加载）
- 检查 `/data/levels/lv1_500.json` 是否存在
- 查看控制台错误信息

### 问题3：服务器无法启动

**检查端口占用：**
```bash
# Mac/Linux
lsof -i :3000

# 如果被占用，杀死进程
kill -9 <PID>
```

**或更换端口：**
```bash
PORT=3001 node server/server.js
```

---

## 📊 性能测试

测试词频查询性能：

```javascript
// 测试查询速度
console.time('查询1000个单词');
const testWords = ['HAVE', 'MAKE', 'GO', 'SEE', 'COME', /* ... 添加更多 */];
for (let i = 0; i < 1000; i++) {
  window.wordFrequencyInstance.getWordRank(testWords[i % testWords.length]);
}
console.timeEnd('查询1000个单词');
// 应该在几毫秒内完成
```

---

## ✅ 验证成功标志

如果看到以下现象，说明更新成功：

- ✅ `HAS`, `HAD`, `HAVING` 等词形不再显示"未知"
- ✅ 词频Map大小 > 20000
- ✅ 单词列表显示使用次数或✨标识
- ✅ 点击 `!` 可以看到完整统计信息
- ✅ 修改关卡等级时，统计范围自动更新
- ✅ 控制台没有错误信息

---

## 🎉 验证完成后

如果验证成功，你可以：

1. **提交代码**
   ```bash
   git add app/web/public/src/scripts/wordFrequency.js
   git commit -m "修复Related forms解析并添加关卡统计功能"
   ```

2. **部署到生产环境**
   按照正常的部署流程进行

3. **团队测试**
   让团队成员也测试新功能

---

## 📞 需要帮助？

如果遇到问题，提供以下信息：

1. 控制台错误信息（截图）
2. 网络请求状态（F12 → Network标签）
3. `window.wordFrequencyInstance` 的状态：
   ```javascript
   console.log({
     isLoaded: window.wordFrequencyInstance.isLoaded,
     mapSize: window.wordFrequencyInstance.frequencyMap.size,
     analysisReady: window.wordFrequencyInstance.levelAnalysis.isAnalysisReady,
     mergedLevels: window.wordFrequencyInstance.levelAnalysis.mergedLevels.size
   });
   ```

