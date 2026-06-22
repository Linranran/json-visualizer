const input = document.querySelector('#input');
const output = document.querySelector('#output');
const tree = document.querySelector('#tree');
const message = document.querySelector('#message');
const inputCount = document.querySelector('#inputCount');
const outputCount = document.querySelector('#outputCount');
const jsonMeta = document.querySelector('#jsonMeta');
const searchInput = document.querySelector('#searchInput');
const textTab = document.querySelector('#textTab');
const treeTab = document.querySelector('#treeTab');

let currentValue = undefined;
let currentView = 'text';

const sample = '{"name":"张三","age":18,"skills":["JSON","可视化"],"active":true,"address":{"city":"北京","code":100000}}';
input.value = sample;

function showMessage(text, type = 'success') {
  message.textContent = text;
  message.className = `message show ${type}`;
}

function clearMessage() {
  message.textContent = '';
  message.className = 'message';
}

function parseJson(text) {
  return JSON.parse(text.trim());
}

function deepParseJson(text, maxDepth = 5) {
  let value = text;
  let depth = 0;

  while (depth < maxDepth && typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return value;

    try {
      value = JSON.parse(trimmed);
      depth += 1;
    } catch {
      return value;
    }
  }

  return value;
}

function stringifyForDisplay(value, space = 2) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, space);
}

function updateCounts() {
  inputCount.textContent = `输入 ${input.value.length} 字符`;
  outputCount.textContent = `输出 ${output.textContent.length} 字符`;
}

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function countNodes(value) {
  if (value === null || typeof value !== 'object') return 1;
  const values = Array.isArray(value) ? value : Object.values(value);
  return 1 + values.reduce((sum, item) => sum + countNodes(item), 0);
}

function updateMeta(value) {
  if (value === undefined) {
    jsonMeta.textContent = '未解析';
    return;
  }

  const type = getType(value);
  const count = countNodes(value);
  jsonMeta.textContent = `${type} · ${count} 节点`;
}

function setResult(value, text, status = '处理完成') {
  currentValue = value;
  output.textContent = text;
  renderTree(value);
  updateCounts();
  updateMeta(value);
  applySearch();
  showMessage(status);
}

function handleError(error) {
  showMessage(`JSON 解析失败：${error.message}`, 'error');
  currentValue = undefined;
  tree.innerHTML = '<div class="summary">无法生成树形视图</div>';
  updateMeta(undefined);
  updateCounts();
}

function formatJson() {
  try {
    const value = parseJson(input.value);
    setResult(value, JSON.stringify(value, null, 2), '格式化完成');
  } catch (error) {
    handleError(error);
  }
}

function minifyJson() {
  try {
    const value = parseJson(input.value);
    setResult(value, JSON.stringify(value), '压缩完成');
  } catch (error) {
    handleError(error);
  }
}

function unescapeJson() {
  try {
    const value = deepParseJson(input.value);
    const text = stringifyForDisplay(value, 2);
    setResult(value, text, '去转义完成');
  } catch (error) {
    handleError(error);
  }
}

function escapeJson() {
  try {
    let source = output.textContent.trim() || input.value.trim();
    let value;

    try {
      value = JSON.parse(source);
      source = JSON.stringify(value);
    } catch {
      value = source;
    }

    const escaped = JSON.stringify(source);
    currentValue = escaped;
    output.textContent = escaped;
    renderTree(escaped);
    updateCounts();
    updateMeta(escaped);
    showMessage('转义完成');
  } catch (error) {
    handleError(error);
  }
}

function clearAll() {
  input.value = '';
  output.textContent = '';
  tree.innerHTML = '<div class="summary">等待输入 JSON</div>';
  currentValue = undefined;
  searchInput.value = '';
  clearMessage();
  updateCounts();
  updateMeta(undefined);
}

async function copyOutput() {
  const text = output.textContent;
  if (!text) {
    showMessage('没有可复制的结果', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showMessage('结果已复制');
  } catch {
    showMessage('复制失败，请手动选择结果复制', 'error');
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function highlight(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(escapedQuery, 'gi'), match => `<mark>${match}</mark>`);
}

function createPrimitiveHtml(value, query) {
  const type = getType(value);
  if (type === 'string') return `<span class="string">"${highlight(value, query)}"</span>`;
  if (type === 'number') return `<span class="number">${value}</span>`;
  if (type === 'boolean') return `<span class="boolean">${value}</span>`;
  if (type === 'null') return '<span class="null">null</span>';
  return `<span>${highlight(String(value), query)}</span>`;
}

function valueMatches(key, value, query) {
  if (!query) return false;
  const lower = query.toLowerCase();
  if (String(key).toLowerCase().includes(lower)) return true;
  if (value === null) return 'null'.includes(lower);
  if (typeof value !== 'object') return String(value).toLowerCase().includes(lower);
  return false;
}

function childMatches(value, query) {
  if (!query) return false;
  if (valueMatches('', value, query)) return true;
  if (value === null || typeof value !== 'object') return false;

  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    if (valueMatches(key, child, query) || childMatches(child, query)) return true;
  }
  return false;
}

function renderNode(key, value, path, query = '') {
  const type = getType(value);
  const hasChildren = value !== null && typeof value === 'object';
  const matched = valueMatches(key, value, query) || childMatches(value, query);
  const ownMatched = valueMatches(key, value, query);
  const keyHtml = key === null ? '' : `<span class="key">${highlight(key, query)}</span><span class="summary">:</span>`;

  if (!hasChildren) {
    return `
      <div class="tree-node" data-path="${escapeHtml(path)}">
        <div class="tree-row ${ownMatched ? 'match' : ''}">
          <span class="toggle placeholder">•</span>
          ${keyHtml}
          ${createPrimitiveHtml(value, query)}
        </div>
      </div>
    `;
  }

  const entries = Array.isArray(value) ? Array.from(value.entries()) : Object.entries(value);
  const summary = Array.isArray(value) ? `array [${value.length}]` : `object {${entries.length}}`;
  const children = entries.map(([childKey, childValue]) => {
    const childPath = Array.isArray(value) ? `${path}[${childKey}]` : path ? `${path}.${childKey}` : childKey;
    return renderNode(String(childKey), childValue, childPath, query);
  }).join('');
  const collapsed = query && matched ? '' : '';

  return `
    <div class="tree-node" data-path="${escapeHtml(path)}">
      <div class="tree-row ${ownMatched ? 'match' : ''}">
        <span class="toggle">▼</span>
        ${keyHtml}
        <span class="type">${summary}</span>
      </div>
      <div class="children ${collapsed}">${children}</div>
    </div>
  `;
}

function renderTree(value) {
  if (value === undefined) {
    tree.innerHTML = '<div class="summary">等待输入 JSON</div>';
    return;
  }

  tree.innerHTML = renderNode(null, value, '$', searchInput.value.trim());
}

function applySearch() {
  if (currentValue === undefined) return;
  renderTree(currentValue);
}

function expandAll() {
  tree.querySelectorAll('.children').forEach(item => item.classList.remove('collapsed'));
  tree.querySelectorAll('.toggle:not(.placeholder)').forEach(item => item.textContent = '▼');
}

function collapseAll() {
  tree.querySelectorAll('.children').forEach(item => item.classList.add('collapsed'));
  tree.querySelectorAll('.toggle:not(.placeholder)').forEach(item => item.textContent = '▶');
}

function setView(view) {
  currentView = view;
  const isText = view === 'text';
  output.classList.toggle('hidden', !isText);
  tree.classList.toggle('hidden', isText);
  textTab.classList.toggle('active', isText);
  treeTab.classList.toggle('active', !isText);
  textTab.setAttribute('aria-selected', String(isText));
  treeTab.setAttribute('aria-selected', String(!isText));
}

document.querySelector('#formatBtn').addEventListener('click', formatJson);
document.querySelector('#minifyBtn').addEventListener('click', minifyJson);
document.querySelector('#unescapeBtn').addEventListener('click', unescapeJson);
document.querySelector('#escapeBtn').addEventListener('click', escapeJson);
document.querySelector('#expandBtn').addEventListener('click', expandAll);
document.querySelector('#collapseBtn').addEventListener('click', collapseAll);
document.querySelector('#copyBtn').addEventListener('click', copyOutput);
document.querySelector('#clearBtn').addEventListener('click', clearAll);
textTab.addEventListener('click', () => setView('text'));
treeTab.addEventListener('click', () => setView('tree'));
searchInput.addEventListener('input', applySearch);
input.addEventListener('input', () => {
  clearMessage();
  updateCounts();
});

tree.addEventListener('click', event => {
  if (!event.target.classList.contains('toggle') || event.target.classList.contains('placeholder')) return;
  const children = event.target.closest('.tree-node').querySelector(':scope > .children');
  if (!children) return;
  children.classList.toggle('collapsed');
  event.target.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
});

updateCounts();
formatJson();
