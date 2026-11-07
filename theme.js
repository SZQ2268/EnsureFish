/* =========================================================
   EnsureFish 主题模块（亮 / 暗 + 跟随系统）
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

  /* meta[name="theme-color"] 位于本脚本之前，可直接缓存复用 */
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  /* 存储值归一化：只接受 'light' | 'dark'，其余（含损坏值）一律视为「跟随系统」 */
  function normalizeStored(value) {
    return (value === 'light' || value === 'dark') ? value : null;
  }

  /* 手动选择；null 表示跟随系统。
     隐私模式下 localStorage 可能抛异常，按「未保存」处理即可。 */
  var saved = null;
  try {
    saved = normalizeStored(localStorage.getItem(STORAGE_KEY));
  } catch (e) { /* ignore */ }

  function resolveTheme() {
    return saved || (mql.matches ? 'dark' : 'light');
  }

  /* ---- 应用主题 ----
     拆成两层：
     applyCore     只依赖 <head> 中的元素，head 阶段即可执行；
     applyControls 依赖 body 中的按钮 / 图标，DOM 就绪后同步才有意义。 */
  function applyCore(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme; // 让滚动条等系统控件同步配色
    if (themeMeta) themeMeta.content = THEME_COLORS[theme];
  }

  function applyControls(theme) {
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

  function apply(theme) {
    applyCore(theme);
    applyControls(theme);
  }

  function persist(value) {
    saved = value;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  /* 事件委托：theme.js 在 <head> 同步执行，此时按钮尚未解析；
     closest 可命中按钮内部的图标元素。 */
  document.addEventListener('click', function (e) {
    var target = e.target;
    var btn = target && target.closest ? target.closest('#themeToggle') : null;
    if (!btn) return;
    var next = resolveTheme() === 'dark' ? 'light' : 'dark';
    persist(next);
    apply(next);
  });

  /* 系统主题变化：仅在用户未手动选择时跟随 */
  function onSystemChange() {
    if (!saved) apply(mql.matches ? 'dark' : 'light');
  }
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onSystemChange);
  } else if (typeof mql.addListener === 'function') { // 旧版 Safari
    mql.addListener(onSystemChange);
  }

  /* 跨标签页同步：其他标签页切换主题时本页跟随。
     同页写入不会触发 storage 事件；e.key === null 表示 storage.clear()，一并处理。 */
  window.addEventListener('storage', function (e) {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    saved = normalizeStored(e.newValue);
    apply(resolveTheme());
  });

  /* 立即应用，避免闪烁；此时按钮尚未解析，applyControls 自然跳过 */
  apply(resolveTheme());

  /* DOM 就绪后补一次，把按钮 / 图标状态同步完整 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      apply(resolveTheme());
    });
  }
})();
