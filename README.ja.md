# EnsureFish

[中文](README.md) | [English](README.en.md) | **日本語**

EnsureFish（因硕贝贝）の個人サイトのソースコードです。

## 技術スタック
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)


## サイト構成

- `index.html` — 中国語トップページ
- `en.html` — 英語トップページ
- `ja.html` — 日本語トップページ
- `404.html` — 404 ページ
- `favicon.svg` — サイトアイコン
- `script.js` — ギャラリー描画、カーソル光彩、モバイルメニュー
- `theme.js` — テーマの初期化と切り替え（同期読み込みで初回描画のちらつきを防止）
- `images.json` — ギャラリー画像リスト
- `images/*.svg` — ナビゲーション、見出し、リンク、ハンバーガーメニューのアイコン（CSS mask で参照、色はテーマに追従）
- `style.css` — 全サイトのスタイル
- `sitemap.xml` — SEO サイトマップ
- `robots.txt` — クローラー向け指示
- `_headers` — セキュリティヘッダー（CSP、Referrer-Policy など）

## 機能

- ライト／ダークテーマの切り替え（システム設定に追従＋手動切り替え）
- レスポンシブデザイン（スマートフォン／タブレット／デスクトップに対応、モバイルはハンバーガーメニュー）
- カーソル光彩エフェクト（アニメーション低減設定に対応、アイドル時は自動停止）
- 画像の遅延読み込み＋プリロード最適化
- アクセシビリティ対応（スキップリンク、ARIA ラベル、アニメーション低減）
- 中国語・英語・日本語の三言語ページ（フッターで切り替え可能）
- 画像は Cloudflare R2 でホスティング
- SEO 対策（Open Graph、canonical、hreflang、サイトマップ）

## デプロイ

静的サイトとして Cloudflare Pages で公開しています：

- [中国語版](https://ensurefish.pages.dev/)
- [英語版](https://ensurefish.pages.dev/en.html)
- [日本語版](https://ensurefish.pages.dev/ja.html)

## ローカルプレビュー

任意の静的サーバーで確認できます。例：
```bash
npx serve .
```

## 著作権

© 2026 EnsureFish · All rights reserved.

本リポジトリのすべてのファイルは学習・参考用です。
