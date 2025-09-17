function renderEditorEntry() {
  document.getElementById('app').innerHTML = `
    <div style="text-align: center; margin-top: 40px;">
      <button id="backToMainBtn_editor">返回</button>
      <h2>关卡编辑</h2>
      <button id="normalEditorBtn">普通关卡编辑</button>
      <button id="replicaEditorBtn">关卡复刻</button>
    </div>
  `;
  document.getElementById('backToMainBtn_editor').onclick = () => location.reload();
  document.getElementById('normalEditorBtn').onclick = () => renderEditorMain();
  document.getElementById('replicaEditorBtn').onclick = () => renderReplicaEditor();
}

// 普通关卡编辑功能
function renderEditorMain() {
  document.getElementById('app').innerHTML = `
    <div>
      <button id="backToEditorEntry">返回</button>
      <h2>普通关卡编辑</h2>
      <input id="editorTitleInput" placeholder="关卡标题" />
      <input id="editorRowsInput" type="number" placeholder="行数(2-20)" />
      <input id="editorColsInput" type="number" placeholder="列数(2-20)" />
      <button id="editorGenBtn">生成关卡</button>
      <div id="editorResultArea"></div>
    </div>
  `;

  document.getElementById('backToEditorEntry').onclick = () => renderEditorEntry();

  document.getElementById('editorGenBtn').onclick = () => {
    const title = document.getElementById('editorTitleInput').value.trim();
    const rows = parseInt(document.getElementById('editorRowsInput').value, 10);
    const cols = parseInt(document.getElementById('editorColsInput').value, 10);

    if (!title || isNaN(rows) || isNaN(cols) || rows < 2 || cols < 2 || rows > 20 || cols > 20) {
      document.getElementById('editorResultArea').innerHTML = '<div style="color:red;">请填写有效的关卡信息</div>';
      return;
    }

    const grid = Array.from({ length: rows }, () => Array(cols).fill('*').join(''));
    const level = { id: 'LEVEL_' + Date.now(), title, words: [], grid };

    const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

// 复刻关卡编辑功能
function renderReplicaEditor() {
  let title = '';
  let words = '';
  let rows = 8;
  let cols = 8;
  let grid = null;

  function render() {
    document.getElementById('app').innerHTML = `
      <div>
        <button id="backToEditorEntry">返回</button>
        <h2>复刻关卡</h2>
        <input id="replicaTitleInput" placeholder="关卡标题" value="${title}" />
        <textarea id="replicaWordsInput" placeholder="单词列表，每行一个">${words}</textarea>
        <input id="replicaRowsInput" type="number" value="${rows}" />
        <input id="replicaColsInput" type="number" value="${cols}" />
        <button id="replicaGridConfirmBtn">生成网格</button>
        <div id="replicaGridArea"></div>
        <button id="replicaExportBtn">导出关卡</button>
      </div>
    `;

    document.getElementById('backToEditorEntry').onclick = () => renderEditorEntry();

    document.getElementById('replicaGridConfirmBtn').onclick = () => {
      title = document.getElementById('replicaTitleInput').value;
      words = document.getElementById('replicaWordsInput').value;
      rows = parseInt(document.getElementById('replicaRowsInput').value, 10);
      cols = parseInt(document.getElementById('replicaColsInput').value, 10);
      grid = Array.from({ length: rows }, () => Array(cols).fill(''));
      render();
    };

    if (grid) {
      let html = '<table>';
      for (let i = 0; i < rows; ++i) {
        html += '<tr>';
        for (let j = 0; j < cols; ++j) {
          html += `<td><input maxlength="1" data-row="${i}" data-col="${j}" /></td>`;
        }
        html += '</tr>';
      }
      html += '</table>';
      document.getElementById('replicaGridArea').innerHTML = html;

      document.querySelectorAll('#replicaGridArea input').forEach(input => {
        input.oninput = (e) => {
          const r = parseInt(e.target.dataset.row, 10);
          const c = parseInt(e.target.dataset.col, 10);
          grid[r][c] = e.target.value.toUpperCase();
        };
      });
    }

    document.getElementById('replicaExportBtn').onclick = () => {
      if (!title || !words || !grid) {
        alert('请填写完整信息并生成网格！');
        return;
      }

      const wordArr = words.split('\n').map(w => w.trim()).filter(Boolean);
      const level = {
        id: 'REPLICA_' + Date.now(),
        title,
        words: wordArr.map(w => ({ word: w, pos: '' })),
        grid: grid.map(row => row.join(''))
      };

      const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `replica-level-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  render();
}

// 导出函数供外部调用
export { renderEditorEntry };
