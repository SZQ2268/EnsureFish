# EnsureFish

[中文](README.md) | **English** | [日本語](README.ja.md)

Source code for EnsureFish's personal homepage.

## Tech Stack
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)


## Site Structure

- `index.html` — Chinese homepage
- `en.html` — English homepage
- `ja.html` — Japanese homepage
- `404.html` — 404 page
- `favicon.svg` — site icon
- `script.js` — gallery rendering, cursor glow, and mobile menu
- `theme.js` — theme bootstrapping and toggle (loaded synchronously to prevent a first-paint flash)
- `images.json` — gallery image manifest
- `images/*.svg` — icons for navigation, headings, links, and the hamburger menu (referenced through CSS masks, colors follow the theme)
- `style.css` — site-wide styles
- `sitemap.xml` — SEO sitemap
- `robots.txt` — crawler directives
- `_headers` — security headers (CSP, Referrer-Policy, etc.)

## Features

- Light/dark theme (follows the system by default, with a manual toggle)
- Responsive design (phone/tablet/desktop, hamburger menu on mobile)
- Cursor glow effect (respects reduced motion, pauses automatically when idle)
- Image lazy loading + preload optimization
- Accessibility (skip link, ARIA labels, reduced-motion support)
- Trilingual pages (Chinese/English/Japanese, switchable in the footer)
- Images hosted on Cloudflare R2
- SEO (Open Graph, canonical, hreflang, sitemap)

## Deployment

This is a fully static site deployed on Cloudflare Pages:

- [Chinese](https://ensurefish.pages.dev/)
- [English](https://ensurefish.pages.dev/en.html)
- [Japanese](https://ensurefish.pages.dev/ja.html)

## Local Preview

Any static server works, for example:
```bash
npx serve .
```

## License

© 2026 EnsureFish · All rights reserved.

All files in this repository are for learning and reference only.
