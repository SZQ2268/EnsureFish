/* =========================================================
   EnsureFish 官网脚本
   1) 主题切换（亮/暗 + 跟随系统）
   2) 画廊图片渲染
   ========================================================= */

/* ========== 1. 主题切换 ========== */
(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var THEME_COLORS = { light: '#ffffff', dark: '#0f1115' };
  var root = document.documentElement;
  var mql = window.matchMedia('(prefers-color-scheme: dark)');
  var meta = document.querySelector('meta[name="theme-color"]');
  var btn = document.getElementById('themeToggle');
  var icon = document.getElementById('themeIcon');

  /* 缓存手动选择，避免每次读写 localStorage */
  var saved = null;
  try {
    var v = localStorage.getItem(STORAGE_KEY);
    saved = (v === 'light' || v === 'dark') ? v : null;
  } catch (e) {}

  function resolveTheme() {
    return saved || (mql.matches ? 'dark' : 'light');
  }

  function persist(value) {
    saved = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* 隐私模式忽略 */ }
  }

  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (meta) meta.content = THEME_COLORS[theme];
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (btn) {
      var label = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  }

  if (btn) {
    btn.addEventListener('click', function () {
      var next = resolveTheme() === 'dark' ? 'light' : 'dark';
      persist(next);
      apply(next);
    });
  }

  function onSystemChange() {
    if (!saved) apply(mql.matches ? 'dark' : 'light');
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemChange);
  } else if (typeof mql.addListener === 'function') { // 旧版 Safari
    mql.addListener(onSystemChange);
  }

  apply(resolveTheme());
})();

/* ========== 2. 画廊渲染 ========== */
(function () {
  'use strict';

  var TARGETS = [
    { id: 'gallery_1', key: 'gallery' },
    { id: 'gallery_2', key: 'fursona' }
  ];

  /* 页面没有画廊容器（如 404）则直接跳过，避免无谓请求 */
  var hasGallery = TARGETS.some(function (t) {
    return document.getElementById(t.id);
  });
  if (!hasGallery) return;

  /* 兼容「字符串」与「{ src, alt }」两种 JSON 写法 */
  function normalize(item, index) {
    if (typeof item === 'string') {
      var s = item.trim();
      return s ? { src: s, alt: '图片 ' + (index + 1) } : null;
    }
    if (item && typeof item === 'object' && typeof item.src === 'string' && item.src.trim()) {
      return { src: item.src.trim(), alt: item.alt || ('图片 ' + (index + 1)) };
    }
    return null;
  }

  function createImage(info) {
    var img = document.createElement('img');
    img.src = info.src;
    img.alt = info.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () {
      img.classList.add('is-error');   // 降透明度 + 灰度，保留布局
      img.alt += '（加载失败）';
    });
    return img;
  }

  function renderImages(box, list) {
    if (!box) return;
    box.textContent = '';

    var items = Array.isArray(list) ? list.map(normalize).filter(Boolean) : [];
    if (items.length === 0) {
      box.textContent = '暂时没有图片';
      return;
    }

    var frag = document.createDocumentFragment();
    items.forEach(function (info) {
      frag.appendChild(createImage(info));
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