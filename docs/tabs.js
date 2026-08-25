// ===== 分頁切換（在「課程邀約信」與「回信小幫手」之間切換） =====
// 兩個工具的完整 UI 都同時存在於這個頁面裡（#view-invite / #view-reply），
// 這支腳本只負責用 hidden 屬性切換顯示哪一個，並記住上次選的分頁。
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.site-tab'));
  var views = {
    invite: document.getElementById('view-invite'),
    reply: document.getElementById('view-reply')
  };

  function setView(name) {
    if (!views[name]) name = 'invite';
    Object.keys(views).forEach(function (key) {
      views[key].hidden = key !== name;
    });
    tabs.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
    try {
      localStorage.setItem('kolToolActiveView', name);
    } catch (e) {}
    if (location.hash.replace('#', '') !== name) {
      history.replaceState(null, '', '#' + name);
    }
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setView(btn.dataset.view);
    });
  });

  var initial = location.hash.replace('#', '');
  if (!views[initial]) {
    try {
      initial = localStorage.getItem('kolToolActiveView');
    } catch (e) {}
  }
  setView(initial || 'invite');
})();
