(function(){
  const editor = document.getElementById('rhEditor');
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

  function focusEditor(){ editor.focus(); }

  // ---------- Basic commands ----------
  document.getElementById('rhBold').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('bold');
  });
  document.getElementById('rhItalic').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('italic');
  });
  document.getElementById('rhUnderline').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('underline');
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
    if (!sel.rangeCount || sel.isCollapsed || !editor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      showToast('請先選取要標記的文字');
      return;
    }
    const isHighlighted = colorIncludes('backColor', '255,255,0');
    document.execCommand('backColor', false, isHighlighted ? 'transparent' : 'rgb(255,255,0)');
  });

  document.getElementById('rhBlue').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed || !editor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      showToast('請先選取要標記的文字');
      return;
    }
    const isBlue = colorIncludes('foreColor', '38,91,246') || colorIncludes('foreColor', '#265bf6');
    document.execCommand('foreColor', false, isBlue ? 'rgb(51,51,51)' : '#265bf6');
  });

  // ---------- Typography (font size / line height) ----------
  const selFontSize = document.getElementById('rhFontSize');
  const selLineHeight = document.getElementById('rhLineHeight');
  function applyTypography(){
    editor.style.fontSize = selFontSize.value + 'px';
    editor.style.lineHeight = selLineHeight.value;
  }
  selFontSize.addEventListener('change', applyTypography);
  selLineHeight.addEventListener('change', applyTypography);
  applyTypography();

  // ---------- Block-level helpers (indent / list / align act on the
  // top-level <p> that the caret or selection is inside) ----------
  function getTopLevelBlock(node){
    if (!node) return null;
    if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
    while (node && node.parentNode !== editor){
      node = node.parentNode;
    }
    return (node && node.nodeType === Node.ELEMENT_NODE) ? node : null;
  }

  function getSelectedTopLevelBlocks(){
    const sel = window.getSelection();
    if (!sel.rangeCount) return [];
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return [];
    const startBlock = getTopLevelBlock(range.startContainer);
    const endBlock = getTopLevelBlock(range.endContainer);
    if (!startBlock) return [];
    let blocks;
    if (!endBlock || startBlock === endBlock){
      blocks = [startBlock];
    } else {
      blocks = [];
      let node = startBlock;
      while (node){
        blocks.push(node);
        if (node === endBlock) break;
        node = node.nextElementSibling;
      }
    }
    // Dividers and the signature block aren't editable paragraphs — never
    // let indent/list/align touch them even if a selection happens to span
    // across one.
    return blocks.filter(el => el && !(el.classList && (el.classList.contains('rh-divider') || el.classList.contains('rh-sig-block'))));
  }

  // ---------- Bullet / numbered "lists" ----------
  // Real <ul>/<li> markup is exactly the kind of nested structure that email
  // clients love to strip or reflow unpredictably on paste (same family of
  // bug as the divider below). Instead we prepend a literal bullet/number
  // character as plain text and fake the hanging indent with padding-left +
  // a negative text-indent — plain <p> tags with inline styles, which is the
  // one structure already proven to survive Gmail's paste sanitizer.
  const LIST_PREFIX_RE = /^(?:● |\d+\. )/;

  function stripListPrefix(el){
    const first = el.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE && LIST_PREFIX_RE.test(first.textContent)){
      const stripped = first.textContent.replace(LIST_PREFIX_RE, '');
      if (stripped){
        first.textContent = stripped;
      } else {
        el.removeChild(first);
      }
    }
  }

  function toggleListPrefix(type){
    focusEditor();
    const blocks = getSelectedTopLevelBlocks();
    if (!blocks.length){
      showToast('請先將游標移到要加上清單的段落');
      return;
    }
    const already = blocks.every(el => el.dataset.rhList === type);
    let n = 1;
    blocks.forEach(el => {
      stripListPrefix(el);
      if (already){
        delete el.dataset.rhList;
        el.style.paddingLeft = '';
        el.style.textIndent = '';
      } else {
        const prefix = type === 'bullet' ? '● ' : (n++) + '. ';
        el.insertBefore(document.createTextNode(prefix), el.firstChild);
        el.dataset.rhList = type;
        el.style.paddingLeft = '20px';
        el.style.textIndent = '-20px';
      }
    });
  }

  document.getElementById('rhBullet').addEventListener('click', ()=>toggleListPrefix('bullet'));
  document.getElementById('rhNumber').addEventListener('click', ()=>toggleListPrefix('number'));

  // ---------- Indent / outdent ----------
  // Plain marginLeft on the <p> itself, rather than execCommand('indent')
  // (which wraps content in a <blockquote> in most browsers — Gmail treats
  // blockquotes as quoted-reply blocks and styles them accordingly, which is
  // not what "indent this paragraph" should mean here).
  function adjustIndent(delta){
    focusEditor();
    const blocks = getSelectedTopLevelBlocks();
    if (!blocks.length){
      showToast('請先將游標移到要縮排的段落');
      return;
    }
    blocks.forEach(el => {
      const current = parseInt(el.style.marginLeft, 10) || 0;
      const next = Math.max(0, Math.min(96, current + delta));
      el.style.marginLeft = next ? next + 'px' : '';
    });
  }

  document.getElementById('rhIndent').addEventListener('click', ()=>adjustIndent(24));
  document.getElementById('rhOutdent').addEventListener('click', ()=>adjustIndent(-24));

  // ---------- Alignment ----------
  document.getElementById('rhAlignLeft').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('justifyLeft');
  });
  document.getElementById('rhAlignCenter').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('justifyCenter');
  });
  document.getElementById('rhAlignRight').addEventListener('click', ()=>{
    focusEditor();
    document.execCommand('justifyRight');
  });

  // ---------- Divider ----------
  // Two independent bugs made the divider vanish on paste, and both had to
  // be fixed:
  // 1) A genuinely content-less block (the old empty <div> divider with no
  //    text inside) gets stripped by Gmail's paste sanitizer — confirmed
  //    because even a byte-exact raw-HTML paste dropped it, which rules out
  //    a clipboard-serialization bug and points at the sanitizer discarding
  //    empty blocks. Fix: a table cell with a literal &nbsp; always has
  //    "content", so it survives — the standard "bulletproof email" divider.
  // 2) Inserting at the literal caret position (via range.insertNode) lands
  //    the new node wherever the Range's container happens to be — which,
  //    since the caret is always logically "inside" some <p>, is usually as
  //    a CHILD of that <p>, not as a sibling line of its own. A <table> is
  //    not valid content inside a <p> at all, so once Gmail re-parses the
  //    pasted HTML it has to un-nest it, and that reshuffling can mangle or
  //    drop styling on the way. Fix: always insert the divider as a
  //    top-level sibling of the current paragraph, using the same
  //    getTopLevelBlock() helper the indent/list/align features use.
  document.getElementById('rhDivider').addEventListener('click', ()=>{
    focusEditor();
    const sel = window.getSelection();
    let anchorBlock = null;
    if (sel.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      anchorBlock = getTopLevelBlock(sel.getRangeAt(0).startContainer);
    }

    const table = document.createElement('table');
    table.className = 'rh-divider';
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('border', '0');
    table.setAttribute('style', 'width:100%;border-collapse:collapse;margin:22px 0');
    table.innerHTML = '<tbody><tr><td style="height:1px;line-height:1px;font-size:1px;background-color:rgb(225,227,225)">&nbsp;</td></tr></tbody>';

    if (anchorBlock && anchorBlock.parentNode === editor){
      editor.insertBefore(table, anchorBlock.nextSibling);
    } else {
      editor.appendChild(table);
    }

    const p = document.createElement('p');
    p.innerHTML = '<br>';
    editor.insertBefore(p, table.nextSibling);

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
    if (!sel.rangeCount || sel.isCollapsed || !editor.contains(sel.getRangeAt(0).commonAncestorContainer)){
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
    if (sel.rangeCount && editor.contains(sel.getRangeAt(0).commonAncestorContainer)){
      range = sel.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
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
  const btnReset = document.getElementById('rhReset');
  const initialHTML = editor.innerHTML;
  let confirmingReset = false;
  let resetTimer = null;
  btnReset.addEventListener('click', ()=>{
    if (!confirmingReset){
      confirmingReset = true;
      btnReset.textContent = '確定清空？再按一次';
      btnReset.classList.add('rh-confirming');
      resetTimer = setTimeout(()=>{
        confirmingReset = false;
        btnReset.textContent = '重新開始';
        btnReset.classList.remove('rh-confirming');
      }, 3000);
      return;
    }
    clearTimeout(resetTimer);
    confirmingReset = false;
    btnReset.textContent = '重新開始';
    btnReset.classList.remove('rh-confirming');
    editor.innerHTML = initialHTML;
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

  // Indent / list / alignment all work by setting inline style properties
  // (marginLeft, paddingLeft, textIndent, textAlign) directly on the live
  // top-level <p>. transformBlock() below normally rebuilds a brand-new <p
  // style="..."> from a fixed template — so without this, any of those
  // properties would silently vanish from the "複製 HTML"/"複製原始碼"
  // export even though they're visible in the live editor. Reading them back
  // off the live element and appending them after the base style keeps them,
  // since a later declaration for the same property wins within one style
  // attribute.
  function extraInlineStyle(el){
    const parts = [];
    const s = el.style;
    if (s.marginLeft) parts.push('margin-left:' + s.marginLeft);
    if (s.paddingLeft) parts.push('padding-left:' + s.paddingLeft);
    if (s.textIndent) parts.push('text-indent:' + s.textIndent);
    if (s.textAlign) parts.push('text-align:' + s.textAlign);
    return parts.length ? (';' + parts.join(';')) : '';
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
      return el.outerHTML; // already inline-styled (bulletproof table+td+&nbsp;)
    }
    if (el.tagName === 'BR'){
      return '<br>';
    }
    if (el.classList && el.classList.contains('rh-signoff')){
      const inner = el.innerHTML.trim() || '<br>';
      return '<p style="color:rgb(51,51,51);margin:0px 0px 28px;font-size:' + fontSizePx + 'px' + extraInlineStyle(el) + '"><font face="garamond, times new roman, serif">' + inner + '</font></p>';
    }
    // generic paragraph-like block (P, or a DIV some browsers create on Enter)
    const inner = el.innerHTML.trim() || '<br>';
    return '<p style="color:rgb(51,51,51);margin:0px 0px 22px;font-size:' + fontSizePx + 'px' + extraInlineStyle(el) + '"><font face="ms pgothic, sans-serif">' + inner + '</font></p>';
  }

  function buildExportHtml(){
    const fontSizePx = selFontSize.value;
    const lineHeight = selLineHeight.value;
    const clone = editor.cloneNode(true);
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
    const text = editor.innerText;

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
      holder.style.position = 'fixed';
      holder.style.left = '-99999px';
      holder.style.top = '0';
      holder.style.opacity = '0';
      holder.style.pointerEvents = 'none';
      holder.contentEditable = 'true';
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

  const sourcePanel = document.getElementById('rhSourcePanel');
  const sourceText = document.getElementById('rhSourceText');

  document.getElementById('rhCopySource').addEventListener('click', ()=>{
    const html = buildExportHtml();
    sourceText.value = html;
    sourcePanel.classList.add('rh-show');
    sourceText.focus();
    sourceText.select();
    const ok = copyPlainText(html);
    showToast(ok ? '已複製 HTML 原始碼！可貼到 HTML 顯示器核對排版' : '已顯示原始碼，請在下方文字框按 Cmd/Ctrl+A 全選、Cmd/Ctrl+C 複製');
  });

  document.getElementById('rhCloseSource').addEventListener('click', ()=>{
    sourcePanel.classList.remove('rh-show');
  });

  // ---------- Active-state feedback for bold ----------
  document.addEventListener('selectionchange', ()=>{
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    if (!editor.contains(sel.anchorNode)) return;
    try{
      document.getElementById('rhBold').classList.toggle('rh-active', document.queryCommandState('bold'));
      document.getElementById('rhItalic').classList.toggle('rh-active', document.queryCommandState('italic'));
      document.getElementById('rhUnderline').classList.toggle('rh-active', document.queryCommandState('underline'));
    }catch(e){}
  });
})();
