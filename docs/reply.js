(function(){
  const rhEditor = document.getElementById('rhEditor');
  const toastEl = document.getElementById('rhToast');
  let toastTimer = null;

  // Make new lines create <p> consistently (rather than a mix of <div>/<p>
  // depending on browser), so the export transform below has a predictable
  // top-level structure to walk.
  try{ document.execCommand('defaultParagraphSeparator', false, 'p'); }catch(e){}

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('rh-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toastEl.classList.remove('rh-show'), 2400);
  }

  function focusEditor(){ rhEditor.focus(); }

  // ---------- Basic commands ----------
  document.getElementById('rhBold').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('bold');
  });
  document.getElementById('rhUndo').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('undo');
  });
  document.getElementById('rhRedo').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('redo');
  });
  document.getElementById('rhClear').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('removeFormat');
  });

  // ---------- Highlight / blue-text toggle ----------
  // Hand-rolled Range.surroundContents() surgery turned out to misbehave on
  // selections that partially overlap existing formatting (it can toggle
  // off — or bleed into — more text than was actually selected), which is
  // what made highlighted text come out wrong after pasting into Gmail even
  // though the in-page preview looked fine. document.execCommand already
  // handles splitting/merging spans across partial selections correctly, so
  // toggling color that way instead is far more robust.
  try{ document.execCommand('styleWithCSS', false, true); }catch(e){}

  function colorIncludes(cmd, needle){
    try{
      const v = document.queryCommandValue(cmd) || '';
      return v.replace(/\s+/g, '').includes(needle);
    }catch(e){
      return false;
    }
  }

  document.getElementById('rhHighlight').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !rhEditor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      showToast('請先選取要標記的文字');
      return;
    }
    const isHighlighted = colorIncludes('backColor', '255,255,0');
    document.execCommand('backColor', false, isHighlighted ? 'transparent' : 'rgb(255,255,0)');
  });

  document.getElementById('rhBlue').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !rhEditor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      showToast('請先選取要標記的文字');
      return;
    }
    const isBlue = colorIncludes('foreColor', '38,91,246') || colorIncludes('foreColor', '#265bf6');
    document.execCommand('foreColor', false, isBlue ? 'rgb(51,51,51)' : '#265bf6');
  });

  // ---------- Typography (font size / line height) ----------
  const rhFontSize = document.getElementById('rhFontSize');
  const rhLineHeight = document.getElementById('rhLineHeight');
  function applyTypography(){
    rhEditor.style.fontSize = rhFontSize.value + 'px';
    rhEditor.style.lineHeight = rhLineHeight.value;
  }
  rhFontSize.addEventListener('change', applyTypography);
  rhLineHeight.addEventListener('change', applyTypography);
  applyTypography();

  // ---------- Divider ----------
  document.getElementById('rhDivider').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    let range;
    if (sel.rangeCount && rhEditor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      range = sel.getRangeAt(0);
      range.collapse(false);
    } else {
      range = document.createRange();
      range.selectNodeContents(rhEditor);
      range.collapse(false);
    }
    const div = document.createElement('div');
    div.className = 'rh-divider';
    div.setAttribute('style', 'height:1px;background-color:rgb(225,227,225);margin:22px 0');
    range.insertNode(div);
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    div.parentNode.insertBefore(p, div.nextSibling);
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  });

  // ---------- Link ----------
  document.getElementById('rhLink').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !rhEditor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      showToast('請先選取要加上連結的文字');
      return;
    }
    const url = prompt('請輸入連結網址：', 'https://');
    if (!url) return;
    const range = sel.getRangeAt(0);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.setAttribute('style', 'color:#265bf6;text-decoration:underline');
    try{
      range.surroundContents(a);
    }catch(e){
      const frag = range.extractContents();
      a.appendChild(frag);
      range.insertNode(a);
    }
    sel.removeAllRanges();
  });

  // ---------- Image ----------
  document.getElementById('rhImage').addEventListener('click', ()=>{
    focusEditor();
    const url = prompt('請輸入圖片網址（URL）：');
    if (!url) return;
    const sel = window.getSelection();
    let range;
    if (sel.rangeCount && rhEditor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(rhEditor);
      range.collapse(false);
    }
    range.deleteContents();
    const img = document.createElement('img');
    img.src = url;
    img.alt = '圖片';
    img.setAttribute('style', 'max-width:100%;height:auto;display:block;border:0;margin:10px 0');
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  // ---------- Reset ----------
  const rhReset = document.getElementById('rhReset');
  const initialHTML = rhEditor.innerHTML;
  let confirmingReset = false;
  let resetTimer = null;
  rhReset.addEventListener('click', ()=>{
    if (!confirmingReset){
      confirmingReset = true;
      rhReset.textContent = '確定清空？再按一次';
      rhReset.classList.add('rh-confirming');
      resetTimer = setTimeout(()=>{
        confirmingReset = false;
        rhReset.textContent = '重新開始';
        rhReset.classList.remove('rh-confirming');
      }, 3000);
      return;
    }
    clearTimeout(resetTimer);
    confirmingReset = false;
    rhReset.textContent = '重新開始';
    rhReset.classList.remove('rh-confirming');
    rhEditor.innerHTML = initialHTML;
    showToast('已重新開始');
  });

  // ---------- Copy HTML ----------
  // Gmail's paste sanitizer does not reliably keep CSS set on an ancestor
  // (font-family, color) — only inline style + legacy <font face> tags on
  // the element that actually holds the text survive consistently. That's
  // the exact pattern the original KOL builder's template uses (every <p>
  // repeats its own color/margin, every run of text is wrapped in
  // <font face="ms pgothic, sans-serif">), so the export step below rebuilds
  // each paragraph the same way instead of relying on inheritance.
  function escapeTextNode(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function transformBlock(node, fontSizePx){
    if (node.nodeType === Node.TEXT_NODE){
      const text = node.textContent;
      if (!text.trim()) return '';
      return '<p style="color:rgb(51,51,51);margin:0px 0px 22px;font-size:' + fontSizePx + 'px"><font face="ms pgothic, sans-serif">' + escapeTextNode(text) + '</font></p>';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node;

    if (el.classList && el.classList.contains('rh-sig-block')){
      return el.innerHTML; // already fully self-contained Gmail signature markup — pass through as-is
    }
    if (el.classList && el.classList.contains('rh-divider')){
      return el.outerHTML; // already inline-styled
    }
    if (el.tagName === 'BR'){
      return '<br>';
    }
    if (el.classList && el.classList.contains('rh-signoff')){
      const inner = el.innerHTML.trim() || '<br>';
      return '<p style="color:rgb(51,51,51);margin:0px 0px 28px;font-size:' + fontSizePx + 'px"><font face="garamond, times new roman, serif">' + inner + '</font></p>';
    }
    // generic paragraph-like block (P, or a DIV some browsers create on Enter)
    const inner = el.innerHTML.trim() || '<br>';
    return '<p style="color:rgb(51,51,51);margin:0px 0px 22px;font-size:' + fontSizePx + 'px"><font face="ms pgothic, sans-serif">' + inner + '</font></p>';
  }

  function buildExportHtml(){
    const fontSizePx = rhFontSize.value;
    const lineHeight = rhLineHeight.value;
    const clone = rhEditor.cloneNode(true);
    const bodyHtml = Array.from(clone.childNodes)
      .map(node => transformBlock(node, fontSizePx))
      .filter(Boolean)
      .join('\n');

    return '<div style="width:100%;background-color:#f5f6f8">'
      + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#f5f6f8"><tbody><tr>'
      + '<td align="center" style="padding:24px 12px">'
      + '<table role="presentation" width="700" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:700px;border-collapse:collapse;background-color:#ffffff;border-top:5px solid #265bf6"><tbody><tr>'
      + '<td style="padding:34px;line-height:' + lineHeight + ';word-break:break-word">'
      + bodyHtml
      + '</td></tr></tbody></table>'
      + '</td></tr></tbody></table></div>';
  }

  async function copyHtml(){
    const html = buildExportHtml();
    const text = rhEditor.innerText;

    try{
      if (navigator.clipboard && window.ClipboardItem){
        const item = new ClipboardItem({
          'text/html': new Blob([html], {type:'text/html'}),
          'text/plain': new Blob([text], {type:'text/plain'})
        });
        await navigator.clipboard.write([item]);
        showToast('已複製，可直接貼到 Gmail！');
        return;
      }
    }catch(e){}

    // Fallback for browsers without the async Clipboard API: select an
    // offscreen copy of the export HTML and use the classic copy command.
    try{
      const holder = document.createElement('div');
      holder.contentEditable = 'true';
      holder.style.position = 'fixed';
      holder.style.left = '-99999px';
      holder.style.top = '0';
      holder.style.opacity = '0';
      holder.style.pointerEvents = 'none';
      holder.innerHTML = html;
      document.body.appendChild(holder);

      const range = document.createRange();
      range.selectNodeContents(holder);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(holder);

      if (ok){
        showToast('已複製，可直接貼到 Gmail！');
        return;
      }
    }catch(e){}

    showToast('自動複製失敗，可以改按「複製原始碼」，或手動選取內文後按 Cmd/Ctrl+C');
  }
  document.getElementById('rhCopy').addEventListener('click', copyHtml);

  // Guaranteed-to-work fallback: put the raw HTML source as plain text on
  // the clipboard (plain-text writes are NOT downgraded the way rich HTML
  // is), and also show it in a textarea so it can always be selected and
  // copied by hand — useful for pasting into an HTML viewer to confirm it
  // renders identically to the preview above.
  function copyPlainText(text){
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-99999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }catch(e){
      return false;
    }
  }

  const rhSourcePanel = document.getElementById('rhSourcePanel');
  const rhSourceText = document.getElementById('rhSourceText');

  document.getElementById('rhCopySource').addEventListener('click', ()=>{
    const html = buildExportHtml();
    rhSourceText.value = html;
    rhSourcePanel.classList.add('rh-show');
    rhSourceText.focus();
    rhSourceText.select();
    const ok = copyPlainText(html);
    showToast(ok ? '已複製 HTML 原始碼！可貼到 HTML 顯示器核對排版' : '已顯示原始碼，請在下方文字框按 Cmd/Ctrl+A 全選、Cmd/Ctrl+C 複製');
  });

  document.getElementById('rhCloseSource').addEventListener('click', ()=>{
    rhSourcePanel.classList.remove('rh-show');
  });

  // ---------- Active-state feedback for bold ----------
  document.addEventListener('selectionchange', ()=>{
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    if (!rhEditor.contains(sel.anchorNode)) return;
    try{
      document.getElementById('rhBold').classList.toggle('rh-active', document.queryCommandState('bold'));
    }catch(e){}
  });
})();