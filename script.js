/* =========================================================
   EnsureFish 官网脚本
   1) 画廊图片渲染
   2) 鼠标光晕跟随
   3) 移动端汉堡菜单
   （主题切换逻辑已独立到 theme.js，在 <head> 中同步加载）
   ========================================================= */

/* ========== 1. 画廊渲染 ========== */
(function () {
  'use strict';

  /* 画廊容器 id 与 images.json 顶层键的对应关系 */
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

  /* 兼容「字符串」与「{ src, alt }」两种 JSON 写法；
     非法项返回 null，由调用方过滤掉。
     注意：直接传给 Array#map 时，index 正好对应 map 的第二个参数。 */
  function normalize(item, index) {
    if (typeof item === 'string') {
      var s = item.trim();
      return s ? { src: s, alt: IMG_PREFIX + (index + 1) } : null;
    }
    if (item && typeof item === 'object' && typeof item.src === 'string' && item.src.trim()) {
      var alt = (typeof item.alt === 'string' && item.alt.trim()) ? item.alt.trim() : null;
      return { src: item.src.trim(), alt: alt || (IMG_PREFIX + (index + 1)) };
    }
    return null;
  }

  function createImage(info) {
    var img = document.createElement('img');

    // 先挂监听再设 src，避免缓存命中时错过 error 事件
    img.addEventListener('error', function () {
      // is-error 同时用于 CSS 降级样式；判重防止重复追加提示
      if (!img.classList.contains('is-error')) {
        img.classList.add('is-error');
        img.alt += ALT_SUFFIX;
      }
    });

    img.src = info.src;
    img.alt = info.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    /* 无 CSS（或老浏览器不支持 aspect-ratio）时的兜底宽高；
       正常布局由 .gallery img 的 aspect-ratio: 4 / 3 控制，避免 CLS */
    img.width = 400;
    img.height = 300;
    return img;
  }

  function renderImages(box, list) {
    if (!box) return;

    var items;
    if (Array.isArray(list)) {
      items = list.map(normalize).filter(Boolean);
    } else if (list == null) {
      items = [];
    } else {
      /* 数据类型异常（如 JSON 手误写成字符串）：按加载失败提示，
         避免静默显示「暂无图片」掩盖配置错误 */
      console.warn('[EnsureFish] 画廊数据应为数组，实际为：', list);
      box.textContent = MESSAGES.error;
      return;
    }

    box.replaceChildren();
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
      console.error('[EnsureFish] 画廊加载失败：', err);
      TARGETS.forEach(function (t) {
        var box = document.getElementById(t.id);
        if (box) box.textContent = MESSAGES.error;
      });
    });
})();

/* ========== 2. 鼠标光晕跟随 ========== */
(function () {
  'use strict';

  /* 只在支持精细指针（鼠标）的设备上运行；触屏设备由 CSS 隐藏兜底 */
  if (!window.matchMedia('(pointer: fine)').matches) return;

  /* 尊重系统「减少动态效果」偏好：完全禁用光晕 */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  /* 初始位置设为视口中心，避免首帧出现在左上角 */
  var targetX = window.innerWidth / 2;
  var targetY = window.innerHeight / 2;
  var currentX = targetX;
  var currentY = targetY;
  var hasMoved = false;
  var running = false;

  /* 缓动系数（以 60fps 为基准）：值越小拖拽感越强，值越大越跟手（建议 0.1 ~ 0.2） */
  var EASE = 0.15;

  /* 动画只在确有需求时运行：
     - 目标与当前位置收敛后立即停止 rAF，避免鼠标不动时 60fps 空转耗电
     - 按真实帧间隔折算缓动系数，让 60 / 120 / 144Hz 屏幕上移动手感一致 */
  var lastFrame = 0; // 0 表示新一轮动画的第一帧

  function step(now) {
    /* 帧间隔（秒），钳制上限防止切后台回来时大步跳变；
       新一轮第一帧 dt = 0，仅校准时间基准不产生位移 */
    var dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
    lastFrame = now;

    // 1 - (1 - EASE)^(dt * 60)：把「每帧系数」换算成该帧间隔对应的系数
    var k = 1 - Math.pow(1 - EASE, dt * 60);

    currentX += (targetX - currentX) * k;
    currentY += (targetY - currentY) * k;

    // translate3d 触发 GPU 合成层；配合 CSS 的 -300px 外边距把圆心对准光标
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
    lastFrame = 0; // 新一轮动画，重置时间基准
    glow.style.willChange = 'transform';
    requestAnimationFrame(step);
  }

  window.addEventListener('mousemove', function (e) {
    targetX = e.clientX;
    targetY = e.clientY;

    // 首次移动时才显示光晕，避免页面刚加载就出现一个亮点
    if (!hasMoved) {
      hasMoved = true;
      glow.style.opacity = '1';
    }
    ensureRunning();
  }, { passive: true }); // 不阻止默认行为，passive 可减少滚动时的响应延迟

  /* 鼠标离开窗口时淡出；移入时若曾移动过则恢复显示并补一次定位 */
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

/* ========== 3. 移动端汉堡菜单 ========== */
(function () {
  'use strict';

  var btn = document.getElementById('menuToggle');
  var bar = document.querySelector('.top_bar');
  if (!btn || !bar) return; // 404 等无导航的页面不存在该按钮

  /* 按 <html lang> 选择无障碍文案 */
  var isEn = (document.documentElement.lang || 'zh-CN')
    .toLowerCase().indexOf('en') === 0;
  var LABELS = {
    open: isEn ? 'Open menu' : '打开菜单',
    close: isEn ? 'Close menu' : '关闭菜单'
  };

  /* 展开状态通过 .nav-open 类交给 CSS 控制（见 style.css 小屏媒体查询） */
  function setOpen(open) {
    bar.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? LABELS.close : LABELS.open);
  }

  /* 按钮切换展开 / 收起 */
  btn.addEventListener('click', function () {
    setOpen(!bar.classList.contains('nav-open'));
  });

  /* 点击菜单中的链接后自动收起，避免下拉面板遮挡目标区块 */
  var nav = bar.querySelector('nav');
  if (nav) {
    nav.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('a')) setOpen(false);
    });
  }

  /* Esc 关闭，并把焦点还给按钮 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bar.classList.contains('nav-open')) {
      setOpen(false);
      btn.focus();
    }
  });

  /* 点击顶栏以外区域关闭。
     按钮自身的点击由上面的处理器处理，这里不会误关。 */
  document.addEventListener('click', function (e) {
    if (!bar.classList.contains('nav-open')) return;
    if (!bar.contains(e.target)) setOpen(false);
  });
})();
