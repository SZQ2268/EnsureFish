/* =========================================================
   EnsureFish 官网脚本
   1) 画廊图片渲染
   2) 鼠标光晕跟随
   3) 移动端汉堡菜单
   （主题切换逻辑已独立到 theme.js，在 <head> 中同步加载）

   三段逻辑共用同一份语言判断，统一在 initAll 中初始化；
   脚本放在 </body> 前，若未来改为 head/defer 加载，DOMContentLoaded 兜底。
   ========================================================= */
(function () {
  'use strict';

  /* 全站唯一的语言判断：与 theme.js 保持一致，按 <html lang> 首段判断。 */
  var LANG = (document.documentElement.lang || 'zh-CN').toLowerCase();

  /* 各语言界面文案；新增语言时在下方追加一项即可。
     语言代码取 <html lang> 的首段（zh-CN / ja / en 均适用），未知语言回退中文。 */
  var TEXT_BY_LANG = {
    zh: {
      empty: '暂时没有图片',
      error: '图片加载失败，请稍后重试',
      imgPrefix: '图片 ',
      altSuffix: '（加载失败）',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单'
    },
    en: {
      empty: 'No images yet.',
      error: 'Failed to load images, please try again later.',
      imgPrefix: 'Image ',
      altSuffix: ' (failed to load)',
      openMenu: 'Open menu',
      closeMenu: 'Close menu'
    },
    ja: {
      empty: 'まだ画像がありません',
      error: '画像を読み込めませんでした。しばらくしてからもう一度お試しください。',
      imgPrefix: '画像 ',
      altSuffix: '（読み込み失敗）',
      openMenu: 'メニューを開く',
      closeMenu: 'メニューを閉じる'
    }
  };

  var TEXT = TEXT_BY_LANG[LANG.split('-')[0]] || TEXT_BY_LANG.zh;

  /* ========== 1. 画廊渲染 ========== */
  /* 画廊容器 id 与 images.json 顶层键的对应关系 */
  var GALLERY_TARGETS = [
    { id: 'gallery_1', key: 'gallery' },
    { id: 'gallery_2', key: 'fursona' }
  ];

  /* 兼容「字符串」与「{ src, alt }」两种 JSON 写法；
     非法项返回 null，由调用方过滤掉。
     注意：直接传给 Array#map 时，index 正好对应 map 的第二个参数。 */
  function normalizeImage(item, index) {
    if (typeof item === 'string') {
      var src = item.trim();
      return src ? { src: src, alt: TEXT.imgPrefix + (index + 1) } : null;
    }
    if (item && typeof item === 'object' &&
        typeof item.src === 'string' && item.src.trim()) {
      var alt = (typeof item.alt === 'string' && item.alt.trim()) ? item.alt.trim() : null;
      return { src: item.src.trim(), alt: alt || (TEXT.imgPrefix + (index + 1)) };
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
        img.alt += TEXT.altSuffix;
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
      items = list.map(normalizeImage).filter(Boolean);
    } else if (list == null) {
      items = [];
    } else {
      /* 数据类型异常（如 JSON 手误写成字符串）：按加载失败提示，
         避免静默显示「暂无图片」掩盖配置错误 */
      console.warn('[EnsureFish] 画廊数据应为数组，实际为：', list);
      box.textContent = TEXT.error;
      return;
    }

    box.replaceChildren();
    if (items.length === 0) {
      box.textContent = TEXT.empty;
      return;
    }

    var frag = document.createDocumentFragment();
    items.forEach(function (info) {
      frag.appendChild(createImage(info));
    });
    box.appendChild(frag);
  }

  /* 收集页面上实际存在的画廊容器；404 等页面没有容器时直接跳过。 */
  function getGalleryBoxes() {
    return GALLERY_TARGETS
      .map(function (target) {
        return { box: document.getElementById(target.id), key: target.key };
      })
      .filter(function (target) { return target.box; });
  }

  /* 默认缓存策略：与 <head> 中的 <link rel="preload" as="fetch">
     相匹配，让预加载真正生效（CDN 会按 ETag 做 304 校验）。
     不要使用 cache: 'no-cache'——那会导致预加载缓存无法命中、产生二次请求。 */
  function initGallery() {
    var targets = getGalleryBoxes();
    if (targets.length === 0) return; // 无画廊容器（如 404）则跳过请求

    /* 加载期间用 aria-busy 告知读屏软件内容仍在更新，成功或失败后都要清除 */
    targets.forEach(function (target) {
      target.box.setAttribute('aria-busy', 'true');
    });

    function showError() {
      targets.forEach(function (target) {
        target.box.textContent = TEXT.error;
        target.box.removeAttribute('aria-busy');
      });
    }

    fetch('./images.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        data = data || {};
        targets.forEach(function (target) {
          renderImages(target.box, data[target.key]);
          target.box.removeAttribute('aria-busy');
        });
      })
      .catch(function (err) {
        console.error('[EnsureFish] 画廊加载失败：', err);
        showError();
      });
  }

  /* ========== 2. 鼠标光晕跟随 ========== */
  function initCursorGlow() {
    /* 只在支持精细指针（鼠标）的设备上运行；触屏设备由 CSS 隐藏兜底 */
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;

    /* 尊重系统「减少动态效果」偏好：完全禁用光晕 */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var glow = document.createElement('div');
    glow.id = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true'); // 纯装饰元素，读屏软件无需感知
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

      glow.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px)';

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
  }

  /* ========== 3. 移动端汉堡菜单 ========== */
  function initMenu() {
    var btn = document.getElementById('menuToggle');
    var bar = document.querySelector('.top_bar');
    if (!btn || !bar) return; // 404 等无导航的页面不存在该按钮

    var nav = bar.querySelector('nav');

    /* 展开状态通过 .nav-open 类交给 CSS 控制（见 style.css 小屏媒体查询） */
    function setOpen(open) {
      bar.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? TEXT.closeMenu : TEXT.openMenu);
    }

    /* 按钮切换展开 / 收起 */
    btn.addEventListener('click', function () {
      setOpen(!bar.classList.contains('nav-open'));
    });

    /* 点击菜单中的链接后自动收起，避免下拉面板遮挡目标区块 */
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

    /* 视口跨过 640px 断点时关闭面板：否则窄屏展开菜单后把窗口拉宽，
       .nav-open 会残留在 .top_bar 上，再缩回小屏时菜单会意外处于展开状态。 */
    if (window.matchMedia) {
      var layoutMql = window.matchMedia('(max-width: 640px)');
      function closeOnWideLayout() {
        if (!layoutMql.matches && bar.classList.contains('nav-open')) setOpen(false);
      }
      if (layoutMql.addEventListener) {
        layoutMql.addEventListener('change', closeOnWideLayout);
      } else if (layoutMql.addListener) { // 旧版 Safari
        layoutMql.addListener(closeOnWideLayout);
      }
    }
  }

  function initAll() {
    initGallery();
    initCursorGlow();
    initMenu();
  }

  /* 脚本当前位于 </body> 前，DOM 已就绪；若未来改为 head/defer 加载，
     这里仍能等 DOM 完成后再初始化。 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
