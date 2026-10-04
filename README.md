# Kトライア瑠璃交通 公式サイト（k-triar.github.io）

Minecraft サーバー内で鉄道を運営する「Kトライア瑠璃交通」のコーポレートサイトです。GitHub Pages で配信する静的サイトで、トップページでは REWIS の公開データから KT線の運行状況を取得して表示します。

- **公開 URL**：<https://k-triar.github.io/>
- **対象環境**：モダンブラウザ
- **主な特徴**：ビルド不要の静的サイト、REWIS と連動した運行状況表示、JavaScript なしでも全情報を閲覧可能

## 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [ページ構成](#ページ構成)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発](#開発)
  - [前提環境](#前提環境)
  - [ローカル実行](#ローカル実行)
  - [運行状況に表示する路線の変更](#運行状況に表示する路線の変更)
- [ライセンス](#ライセンス)
- [免責事項](#免責事項)

## 概要

Kトライア瑠璃交通の企業情報・事業紹介・ニュースを掲載するサイトです。事業は「瑠璃国内の鉄道運営」「全世界鉄道情報システム REWIS の運営」「TrainCarts 運行方式の開発・規格策定」の3つで、REWIS（`/rewis/`）と TC Builder（`/tc-builder/`）は別リポジトリから同じドメイン配下に公開しています。

トップページの運行状況は、REWIS の公開 API からデータを取得し、ブラウザ上で各路線の状態を判定して表示します。

```
[ REWIS 公開 API ]（Cloudflare Workers・/v2/public）
       │ 60 秒ごとに取得（表示中のみ）
       ▼
[ status.js ] ── REWIS の model.js を読み込み、路線ごとの状態を判定
       │
       ▼
[ トップページ「KT線 運行状況」 ] ──> main.js が固定ヘッダーのサマリを更新
```

状態の判定と表記（平常運転・運行情報あり・運転見合わせ）は REWIS のトップページと共通です。

## 主な機能

| 機能 | 概要 | 備考 |
|---|---|---|
| KT線 運行状況 | REWIS の運行情報から路線ごとの状態を表示 | 取得に失敗した場合は「取得できません」と表示 |
| 固定ヘッダー | スクロール時にナビゲーションと運行状況のサマリを表示 | `main.js` が `.mainHeader` の内容から生成 |
| メインビジュアル | 画像スライダー（自動再生・一時停止） | 視差効果を減らす設定（`prefers-reduced-motion`）では停止状態で開始 |
| ニュース | カテゴリ別タブで最新情報を表示 | |
| REWIS への導線 | 乗換案内・運行状況の詳細・事業者向けページへのリンク | リンク先は REWIS 側のページ |

## ページ構成

| ページ | 内容 |
|---|---|
| `index.html` | トップページ（運行状況・メインビジュアル・事業紹介・ニュース） |
| `company/` | 企業情報 |
| `services/` | 鉄道運営 |
| `news/` | ニュース |
| `contact/` | お問い合わせ |
| `policy/` | サイトポリシー |

## ディレクトリ構成

```
.
├── index.html            # トップページ
├── company/, services/, news/, contact/, policy/
│                         # 下層ページ（各 index.html）
├── main.js               # 全ページ共通（固定ヘッダー・メニュー開閉）
├── home.js               # トップページ専用（メインビジュアル・ニュースタブ）
├── status.js             # トップページ専用（REWIS からの運行状況取得）
├── styles.css            # 全ページ共通のスタイル
├── assets/
│   ├── icons/            # Kトライア瑠璃・REWIS・TC Builder のロゴ
│   └── img/              # メインビジュアル画像
├── robots.txt            # クローラー向け設定（ドメイン全体に効くため REWIS の分も兼ねる）
├── sitemap.xml           # 本サイトと REWIS 公開ページの一覧（Search Console に送信）
├── google*.html          # Google Search Console の所有権確認用（削除しない）
└── LICENSE
```

## 開発

### 前提環境

- モダンブラウザ
- ローカル確認用の静的ファイルサーバー（Python 3 または Node.js）

ビルド工程や外部の実行時依存パッケージはありません。

### ローカル実行

`status.js` は ES Modules として読み込むため、`file://` ではなくローカルサーバー経由で開きます。

```bash
# Python を使用する場合
python -m http.server 8000

# Node.js (npx) を使用する場合
npx serve -l 8000 .
```

起動後、ブラウザで `http://localhost:8000` を開きます。`rewis/` や `tc-builder/` へのリンクは別リポジトリのページのため、ローカルでは表示されません。

### 運行状況に表示する路線の変更

表示する路線は、`index.html` の運行状況リストにある `li.lineStatus` の `data-line-id`（REWIS の路線 ID）で指定しています。路線を増減するときは `li` を追加・削除するだけで、`status.js` の変更は不要です。路線名は REWIS の登録内容で上書きされます。

## ライセンス

本プロジェクトは **[GNU Affero General Public License v3.0 or later（AGPL-3.0-or-later）](LICENSE)** のもとで公開されています。

```
Copyright (C) 2026 K-Triar Luli Transport
```

### 利用条件と特記事項

- **ネットワーク経由での利用（AGPL §13）**：本ソフトウェアを改変してネットワーク経由でサービス・機能として提供する場合、バイナリを直接配布していなくても、その利用者に対して改変後のソースコードを開示する義務があります。フォークを公開リポジトリ等に配置し、利用者へ案内してください。
- **ロゴマークの除外**：「Kトライア瑠璃」のブランドロゴマーク（`assets/icons/kt_luli_logo*.svg`）、「REWIS」のロゴ（`assets/icons/rewis_logo*.svg`）および「TC Builder」のロゴ（`assets/icons/tc-builder.svg`）は AGPL の対象外です。Kトライア瑠璃の許諾なく無断で使用することはできません。
- **文章・画像の除外**：サイト内の文章（企業情報・事業紹介・ニュース等）および画像（`assets/img/` 配下のメインビジュアル等）は AGPL の対象外です。Kトライア瑠璃の許諾なく転載・再利用することはできません。
- **REWIS との関係**：運行状況の判定ロジックおよび状態の配色は、同じく AGPL-3.0-or-later で公開している [REWIS](https://github.com/K-Triar/rewis) に由来します。`status.js` は REWIS の公開モジュール（`model.js`）を実行時に読み込みます。

## 免責事項

本プロジェクトは Minecraft 公式の製品・サービスではありません。Mojang または Microsoft から承認を受けておらず、それらとの関連性もありません。

「Minecraft」は Mojang Synergies AB の商標です。
