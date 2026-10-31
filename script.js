/* =========================================================
   EnsureFish 官网脚本
   1) 画廊图片渲染
   2) 鼠标光晕跟随
   （主题切换逻辑已独立到 theme.js，在 <head> 中同步加载）
   ========================================================= */

/* ========== 1. 画廊渲染 ========== */
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

  /* 按 <html lang> 选择文案，避免英文页出现中文提示 */
  var isEn = (document.documentElement.lang || 'zh-CN')
    .toLowerCase().indexOf('en') === 0;
  var MESSAGES = isEn
    ? { empty: 'No images yet.', error: 'Failed to load images, please try again later.' }
    : { empty: '暂时没有图片', error: '图片加载失败，请稍后重试' };
  var IMG_PREFIX = isEn ? 'Image ' : '图片 ';
  var ALT_SUFFIX = isEn ? ' (failed to load)' : '（加载失败）';

  /* 兼容「字符串」与「{ src, alt }」两种 JSON 写法 */
  function normalize(item, index) {
    if (typeof item === 'string') {
      var s = item.trim();
      return s ? { src: s, alt: IMG_PREFIX + (index + 1) } : null;
    }
    if (item && typeof item === 'object' && typeof item.src === 'string' && item.src.trim()) {
      return {
        src: item.src.trim(),
        alt: item.alt || (IMG_PREFIX + (index + 1))
      };
    }
    return null;
  }

  function createImage(info) {
    var img = document.createElement('img');

    // 先挂监听再设 src，避免缓存命中时错过 error 事件
    img.addEventListener('error', function () {
      if (!img.classList.contains('is-error')) { // 防止重复触发叠加后缀
        img.classList.add('is-error');
        img.alt += ALT_SUFFIX;
      }
    });

    img.src = info.src;
    img.alt = info.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = 'low'; // 降低画廊图片的网络优先级
    img.width = 400;  // 占位宽高，辅助浏览器预留布局、避免 CLS
    img.height = 300;
    return img;
  }

  function renderImages(box, list) {
    if (!box) return;
    box.textContent = '';

    var items = Array.isArray(list) ? list.map(normalize).filter(Boolean) : [];
    if (items.length === 0) {
      box.textContent = MESSAGES.empty;
      return;
    }

    var frag = document.createDocumentFragment();
    items.forEach(function (info) {
      frag.appendChild(createImage(info));
    });
    box.appendChild(frag);
  }

  /* 默认缓存策略：与 <head> 中的 <link rel="preload" as="fetch">
     相匹配，让预加载真正生效（CDN 会按 ETag 做 304 校验）。
     不要使用 cache: 'no-cache'——那会导致预加载缓存无法命中、产生二次请求。 */
  fetch('./images.json')
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
        if (box) box.textContent = MESSAGES.error;
      });
    });
})();

/* ========== 2. 鼠标光晕跟随 ========== */
(function () {
  'use strict';

  /* 只在支持精细指针（鼠标）的设备上运行 */
  if (!window.matchMedia('(pointer: fine)').matches) return;

  /* 尊重系统「减少动态效果」偏好：完全禁用光晕 */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  var targetX = window.innerWidth / 2;
  var targetY = window.innerHeight / 2;
  var currentX = targetX;
  var currentY = targetY;
  var hasMoved = false;
  var running = false;

  /* 缓动系数：值越小拖拽感越强，值越大越跟手（建议 0.1 ~ 0.2） */
  var EASE = 0.15;

  /* 只在确有动画需求时运行 rAF 循环；
     收敛后立即停止，避免鼠标不动时 60fps 空转耗电。 */
  function step() {
    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;

    // 使用 translate3d 触发 GPU 加速
    glow.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0)';

    var settled = Math.abs(targetX - currentX) < 0.5 &&
                  Math.abs(targetY - currentY) < 0.5;
    if (settled) {
      running = false;
      glow.style.willChange = 'auto'; // 释放合成层，降低内存占用
      return;
    }
    requestAnimationFrame(step);
  }

  function ensureRunning() {
    if (running) return;
    running = true;
    glow.style.willChange = 'transform';
    requestAnimationFrame(step);
  }

  window.addEventListener('mousemove', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;

    // 首次移动时才显示光晕
    if (!hasMoved) {
      hasMoved = true;
      glow.style.opacity = '1';
    }
    ensureRunning();
  });

  // 鼠标离开窗口时淡出；移入时若曾移动过则重新显示
  document.addEventListener('mouseleave', function () {
    glow.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (hasMoved) {
      glow.style.opacity = '1';
      ensureRunning();
    }
  });
})();
