/* =========================================================
   EnsureFish 主题模块（亮/暗 + 跟随系统）
   在 <head> 中同步加载，先于首帧渲染应用主题，避免闪烁 (FOUC)。
   主题按钮通过事件委托绑定，因此可以在 head 阶段运行。
   全站（index / en / 404）共用这一份实现，避免三处内联脚本漂移。
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var THEME_COLORS = { light: '#ffffff', dark: '#0f1115' };
  var root = document.documentElement;
  var isEnglish = (root.lang || '').toLowerCase().indexOf('en') === 0;
  var mql = window.matchMedia('(prefers-color-scheme: dark)');

  /* 缓存手动选择，避免每次读写 localStorage */
  var saved = null;
  try {
    var v = localStorage.getItem(STORAGE_KEY);
    saved = (v === 'light' || v === 'dark') ? v : null;
  } catch (e) { /* 隐私模式等场景忽略 */ }

  function resolveTheme() {
    return saved || (mql.matches ? 'dark' : 'light');
  }

  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = THEME_COLORS[theme];

    var icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';

    var btn = document.getElementById('themeToggle');
    if (btn) {
      var label = theme === 'dark'
        ? (isEnglish ? 'Switch to light mode' : '切换到浅色模式')
        : (isEnglish ? 'Switch to dark mode' : '切换到深色模式');
      btn.setAttribute('aria-label', label);
      btn.title = label;
    }
  }

  function persist(value) {
    saved = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* 隐私模式等场景忽略 */ }
  }

  /* 事件委托：theme.js 在 <head> 同步执行，此时按钮尚未解析 */
  document.addEventListener('click', function (e) {
    var target = e.target;
    var btn = target && target.closest ? target.closest('#themeToggle') : null;
    if (!btn) return;
    var next = resolveTheme() === 'dark' ? 'light' : 'dark';
    persist(next);
    apply(next);
  });

  function onSystemChange() {
    if (!saved) apply(mql.matches ? 'dark' : 'light');
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemChange);
  } else if (typeof mql.addListener === 'function') { // 旧版 Safari
    mql.addListener(onSystemChange);
  }

  /* 跨标签页同步：其他标签页切换主题时本页跟随（同页不触发 storage 事件） */
  window.addEventListener('storage', function (e) {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    var v = e.newValue;
    saved = (v === 'light' || v === 'dark') ? v : null;
    apply(resolveTheme());
  });

  /* 立即应用，避免闪烁 */
  apply(resolveTheme());

  /* DOM 就绪后补一次，把按钮 / 图标状态同步完整 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      apply(resolveTheme());
    });
  }
})();
