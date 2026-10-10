/* =========================================================
   EnsureFish 官网脚本
   1) 主题切换（亮/暗 + 跟随系统）
   2) 画廊图片渲染
   ========================================================= */

/* ========== 1. 主题切换 ========== */
(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var mql = window.matchMedia('(prefers-color-scheme: dark)');
  var meta = document.querySelector('meta[name="theme-color"]');
  var btn = document.getElementById('themeToggle');
  var icon = document.getElementById('themeIcon');

  /* 读取用户手动选择的主题；非法值一律视为「未选择」 */
  function readSaved() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return (v === 'light' || v === 'dark') ? v : null;
    } catch (e) {
      return null;
    }
  }

  function writeSaved(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* 隐私模式下可能失败，忽略 */ }
  }

  /* 唯一数据源：手动选择优先，否则跟随系统 */
  function resolveTheme() {
    return readSaved() || (mql.matches ? 'dark' : 'light');
  }

  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (meta) meta.content = theme === 'dark' ? '#0f1115' : '#ffffff';
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (btn) {
      btn.setAttribute('aria-label',
        theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    }
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var next = resolveTheme() === 'dark' ? 'light' : 'dark';
      writeSaved(next);   // 写入后即覆盖系统设置
      apply(next);
    });
  }

  /* 用户没手动选过时，实时跟随系统 */
  function onSystemChange() {
    if (!readSaved()) apply(mql.matches ? 'dark' : 'light');
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemChange);
  } else if (typeof mql.addListener === 'function') { // 旧版 Safari
    mql.addListener(onSystemChange);
  }

  /* 补齐首屏图标 / aria 状态 */
  apply(resolveTheme());
})();

/* ========== 2. 画廊渲染 ========== */
(function () {
  'use strict';

  var TARGETS = [
    { id: 'gallery_1', key: 'gallery' },
    { id: 'gallery_2', key: 'fursona' }
  ];

  function renderImages(box, list) {
    if (!box) return;
    box.textContent = '';

    if (!Array.isArray(list) || list.length === 0) {
      box.textContent = '暂时没有图片';
      return;
    }

    var frag = document.createDocumentFragment();
    list.forEach(function (url) {
      if (typeof url !== 'string' || url.trim() === '') return;

      var img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () { img.remove(); });
      frag.appendChild(img);
    });

    box.appendChild(frag);
  }

  fetch('./images.json', { cache: 'no-cache' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      data = data || {};
      TARGETS.forEach(function (t) {
        renderImages(document.getElementById(t.id), data[t.key]);
      });
    })
    .catch(function (err) {
      console.error('画廊加载失败：', err);
      TARGETS.forEach(function (t) {
        var box = document.getElementById(t.id);
        if (box) box.textContent = '图片加载失败，请稍后重试';
      });
    });
})();