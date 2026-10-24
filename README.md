# EnsureFish

因硕贝贝（EnsureFish）的个人官网源码。

## 结构

- `index.html` — 中文首页
- `en.html` — 英文首页
- `404.html` — 404 页面（Cloudflare Pages 自动识别）
- `script.js` — 主题切换 + 画廊渲染
- `images.json` — 画廊图片清单
- `style.css` — 全站样式（含明暗主题）

## 部署

本站为纯静态站点。

[在Cloudflare上](https://ensurefish.pages.dev/)

## 本地预览

```bash
# 任意静态服务器均可，例如：
npx serve .
```