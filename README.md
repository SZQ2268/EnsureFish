# EnsureFish

因硕贝贝（EnsureFish）的个人官网源码。

## 架构
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)


## 网站结构

- `index.html` 中文首页
- `en.html` 英文首页
- `404.html` 404 页面
- `favicon.svg` 网站图标
- `script.js` 画廊渲染 + 鼠标光晕
- `theme.js` 主题引导与切换（同步加载，避免首屏闪烁）
- `images.json` 画廊图片清单
- `style.css` 全站样式
- `sitemap.xml` SEO 站点地图
- `robots.txt` 搜索引擎爬虫指令

## 功能特性

- `明暗主题切换`（自动跟随系统 + 手动切换）
- `响应式设计`（适配手机/平板/桌面）
- `鼠标光晕跟随特效`（支持减少动画模式，空闲时自动暂停动画）
- `图片懒加载 + 预加载优化`
- `无障碍支持`（跳过链接、ARIA 标签、减少动画模式）
- `中英双语对照`
- `图片托管在 Cloudflare R2 上`
- `SEO 优化`（Open Graph、sitemap）

## 部署

本站为纯静态站点。

![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white) 上的站：
[中文版](https://ensurefish.pages.dev/)
[英文版](https://ensurefish.pages.dev/en.html)

## 本地预览

任意静态服务器均可，例如：
```bash
npx serve .
```

## 权利

2026 © 保留所有权利

本仓库所有文件仅供学习！
