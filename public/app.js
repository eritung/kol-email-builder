// ===== 前端互動邏輯 =====
// 左側表單 <-> state.current 資料物件 <-> 右側預覽 iframe
// 課程資料透過 /api/courses 這組 REST API 存到後端 SQLite 資料庫。

const state = {
  current: JSON.parse(JSON.stringify(DEFAULT_DATA)),
  currentId: null,
  currentName: null,
};

const els = {
  formPanel: document.getElementById('formPanel'),
  previewFrame: document.getElementById('previewFrame'),
  courseSelect: document.getElementById('courseSelect'),
  saveStatus: document.getElementById('saveStatus'),
  toast: document.getElementById('toast'),
  highlightsList: document.getElementById('highlightsList'),
  imagesList: document.getElementById('imagesList'),
  credentialsList: document.getElementById('credentialsList'),
};

// ---------- 工具 ----------

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function updateSaveStatus() {
  if (state.currentId) {
    els.saveStatus.textContent = `正在編輯：${state.currentName}`;
  } else {
    els.saveStatus.textContent = '尚未儲存的新課程（記得按「儲存課程」）';
  }
}

let previewTimer = null;
function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const html = renderEmailHTML(state.current);
    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f5f6f8">${html}</body></html>`;
    els.previewFrame.srcdoc = doc;
  }, 120);
}

// ---------- 一般欄位（input / textarea / checkbox） ----------

function bindStaticFields() {
  const fields = els.formPanel.querySelectorAll('[data-field]');
  fields.forEach(el => {
    // 略過在 repeater 容器內的欄位（那些是動態生成、另外綁定）
    if (el.closest('.repeater-list')) return;
    const key = el.dataset.field;
    const isCheckbox = el.dataset.type === 'checkbox';
    el.addEventListener('input', () => {
      state.current[key] = isCheckbox ? el.checked : el.value;
      updatePreview();
    });
    el.addEventListener('change', () => {
      if (isCheckbox) {
        state.current[key] = el.checked;
        updatePreview();
      }
    });
  });
}

function renderStaticFields() {
  const fields = els.formPanel.querySelectorAll('[data-field]');
  fields.forEach(el => {
    if (el.closest('.repeater-list')) return;
    const key = el.dataset.field;
    const isCheckbox = el.dataset.type === 'checkbox';
    const val = state.current[key];
    if (isCheckbox) {
      el.checked = !!val;
    } else {
      el.value = val === undefined || val === null ? '' : val;
    }
  });
}

// ---------- Repeater: 課程亮點 ----------

function renderHighlights() {
  const list = state.current.highlights || [];
  els.highlightsList.innerHTML = '';
  list.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'repeater-item';
    wrap.innerHTML = `
      <label>亮點標題
        <input type="text" placeholder="例如：根本修復・六大毒型精準檢測">
      </label>
      <label>亮點說明
        <textarea rows="2" placeholder="說明文字"></textarea>
      </label>
      <button type="button" class="remove-btn">✕ 刪除這則亮點</button>
    `;
    const titleInput = wrap.querySelector('input');
    const bodyInput = wrap.querySelector('textarea');
    titleInput.value = item.title || '';
    bodyInput.value = item.body || '';
    titleInput.addEventListener('input', () => { item.title = titleInput.value; updatePreview(); });
    bodyInput.addEventListener('input', () => { item.body = bodyInput.value; updatePreview(); });
    wrap.querySelector('.remove-btn').addEventListener('click', () => {
      state.current.highlights.splice(idx, 1);
      renderHighlights();
      updatePreview();
    });
    els.highlightsList.appendChild(wrap);
  });
}

document.getElementById('btnAddHighlight').addEventListener('click', () => {
  if (!state.current.highlights) state.current.highlights = [];
  state.current.highlights.push({ title: '', body: '' });
  renderHighlights();
  updatePreview();
});

// ---------- Repeater: 課程圖片 ----------

function renderImages() {
  const list = state.current.images || [];
  els.imagesList.innerHTML = '';
  list.forEach((item, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'repeater-item';
    wrap.innerHTML = `
      <label>圖片網址
        <input type="text" placeholder="https://...">
      </label>
      <label>替代文字（alt，選填）
        <input type="text" placeholder="課程頁面截圖">
      </label>
      <button type="button" class="remove-btn">✕ 刪除這張圖片</button>
    `;
    const urlInput = wrap.querySelectorAll('input')[0];
    const altInput = wrap.querySelectorAll('input')[1];
    urlInput.value = item.url || '';
    altInput.value = item.alt || '';
    urlInput.addEventListener('input', () => { item.url = urlInput.value; updatePreview(); });
    altInput.addEventListener('input', () => { item.alt = altInput.value; updatePreview(); });
    wrap.querySelector('.remove-btn').addEventListener('click', () => {
      state.current.images.splice(idx, 1);
      renderImages();
      updatePreview();
    });
    els.imagesList.appendChild(wrap);
  });
}

document.getElementById('btnAddImage').addEventListener('click', () => {
  if (!state.current.images) state.current.images = [];
  state.current.images.push({ url: '', alt: '' });
  renderImages();
  updatePreview();
});

// ---------- Repeater: 講師經歷條列 ----------

function renderCredentials() {
  const list = state.current.credentials || [];
  els.credentialsList.innerHTML = '';
  list.forEach((text, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'repeater-item';
    wrap.innerHTML = `
      <label>經歷條列 <span class="hint">會自動加上「■」符號</span>
        <input type="text" placeholder="例如：行醫40年，協助10,000+個案完成排毒">
      </label>
      <button type="button" class="remove-btn">✕ 刪除</button>
    `;
    const input = wrap.querySelector('input');
    input.value = text || '';
    input.addEventListener('input', () => { state.current.credentials[idx] = input.value; updatePreview(); });
    wrap.querySelector('.remove-btn').addEventListener('click', () => {
      state.current.credentials.splice(idx, 1);
      renderCredentials();
      updatePreview();
    });
    els.credentialsList.appendChild(wrap);
  });
}

document.getElementById('btnAddCredential').addEventListener('click', () => {
  if (!state.current.credentials) state.current.credentials = [];
  state.current.credentials.push('');
  renderCredentials();
  updatePreview();
});

// ---------- 整體渲染 ----------

function renderAll() {
  renderStaticFields();
  renderHighlights();
  renderImages();
  renderCredentials();
  updateSaveStatus();
  updatePreview();
}

// ---------- 課程資料庫 API ----------

async function fetchCourseList() {
  const res = await fetch('/api/courses');
  if (!res.ok) throw new Error('讀取課程列表失敗');
  return res.json();
}

async function fetchCourse(id) {
  const res = await fetch(`/api/courses/${id}`);
  if (!res.ok) throw new Error('讀取課程資料失敗');
  return res.json();
}

async function createCourse(name, data) {
  const res = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('新增課程失敗');
  return res.json();
}

async function updateCourseApi(id, name, data) {
  const res = await fetch(`/api/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, data }),
  });
  if (!res.ok) throw new Error('更新課程失敗');
  return res.json();
}

async function deleteCourseApi(id) {
  const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('刪除課程失敗');
}

async function refreshCourseSelect(selectId) {
  const list = await fetchCourseList();
  els.courseSelect.innerHTML = '<option value="">－ 新的一封信（未儲存） －</option>';
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    els.courseSelect.appendChild(opt);
  });
  if (selectId) els.courseSelect.value = selectId;
}

// ---------- 按鈕事件 ----------

document.getElementById('btnNewCourse').addEventListener('click', () => {
  state.current = JSON.parse(JSON.stringify(DEFAULT_DATA));
  state.currentId = null;
  state.currentName = null;
  els.courseSelect.value = '';
  renderAll();
  showToast('已開啟新課程範本，記得填完後按「儲存課程」');
});

document.getElementById('btnSave').addEventListener('click', async () => {
  try {
    if (state.currentId) {
      await updateCourseApi(state.currentId, state.currentName, state.current);
      showToast(`已更新課程「${state.currentName}」`);
    } else {
      const suggested = state.current.courseTitle
        ? `${state.current.courseTitle}－${state.current.recipientName || ''}`.trim()
        : '未命名課程';
      const name = window.prompt('請輸入這筆課程資料的名稱（方便之後從清單找回）：', suggested);
      if (!name) return;
      const created = await createCourse(name, state.current);
      state.currentId = created.id;
      state.currentName = created.name;
      await refreshCourseSelect(created.id);
      showToast(`已儲存課程「${created.name}」`);
    }
    updateSaveStatus();
  } catch (err) {
    console.error(err);
    showToast('儲存失敗，請稍後再試');
  }
});

document.getElementById('btnSaveAs').addEventListener('click', async () => {
  try {
    const suggested = state.currentName ? `${state.currentName} 複製` :
      (state.current.courseTitle ? `${state.current.courseTitle}－${state.current.recipientName || ''}`.trim() : '未命名課程');
    const name = window.prompt('另存新檔：請輸入新的課程資料名稱', suggested);
    if (!name) return;
    const created = await createCourse(name, state.current);
    state.currentId = created.id;
    state.currentName = created.name;
    await refreshCourseSelect(created.id);
    showToast(`已另存為「${created.name}」`);
    updateSaveStatus();
  } catch (err) {
    console.error(err);
    showToast('另存失敗，請稍後再試');
  }
});

document.getElementById('btnDelete').addEventListener('click', async () => {
  if (!state.currentId) {
    showToast('目前是未儲存的新課程，沒有東西可以刪除');
    return;
  }
  if (!window.confirm(`確定要刪除課程「${state.currentName}」嗎？此動作無法復原。`)) return;
  try {
    await deleteCourseApi(state.currentId);
    showToast('已刪除課程資料');
    state.current = JSON.parse(JSON.stringify(DEFAULT_DATA));
    state.currentId = null;
    state.currentName = null;
    await refreshCourseSelect();
    renderAll();
  } catch (err) {
    console.error(err);
    showToast('刪除失敗，請稍後再試');
  }
});

els.courseSelect.addEventListener('change', async () => {
  const id = els.courseSelect.value;
  if (!id) {
    state.current = JSON.parse(JSON.stringify(DEFAULT_DATA));
    state.currentId = null;
    state.currentName = null;
    renderAll();
    return;
  }
  try {
    const course = await fetchCourse(id);
    state.current = Object.assign(JSON.parse(JSON.stringify(DEFAULT_DATA)), course.data);
    state.currentId = course.id;
    state.currentName = course.name;
    renderAll();
    showToast(`已載入課程「${course.name}」`);
  } catch (err) {
    console.error(err);
    showToast('載入課程資料失敗');
  }
});

// ---------- 複製 HTML ----------

document.getElementById('btnCopyHtml').addEventListener('click', async () => {
  const html = renderEmailHTML(state.current);
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      showToast('已複製！可以直接貼到 Gmail 草稿內容區');
    } else {
      // 後備方案：選取隱藏的 contenteditable 區塊後 execCommand('copy')
      const tmp = document.createElement('div');
      tmp.contentEditable = 'true';
      tmp.style.position = 'fixed';
      tmp.style.left = '-9999px';
      tmp.innerHTML = html;
      document.body.appendChild(tmp);
      const range = document.createRange();
      range.selectNodeContents(tmp);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(tmp);
      showToast('已複製！可以直接貼到 Gmail 草稿內容區');
    }
  } catch (err) {
    console.error(err);
    showToast('複製失敗，你的瀏覽器可能不支援，請改用手動選取複製');
  }
});

// ---------- 啟動 ----------

(async function init() {
  bindStaticFields();
  try {
    await refreshCourseSelect();
  } catch (err) {
    console.error(err);
    showToast('無法連線到課程資料庫，仍可離線編輯與預覽');
  }
  renderAll();
})();
