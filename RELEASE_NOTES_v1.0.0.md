# Release Notes - v1.0.0

**Release Date:** 2025-12-01

Thread-based note-taking application の初回正式リリースです。

---

## ✨ Features

### Core Functionality

- **スレッド型ノート機能**: ノートを作成し、返信でスレッド化された会話を構築
- **メンション機能**: `@ID` 構文で他のノートを参照・リンク
- **全文検索**: ノート内容やメンションでの高速検索
- **編集・削除**: ノートの編集と削除（カスケード削除対応）
- **2階層制限**: 返信の深さを2階層に制限するシンプルな構造

### User Interface

- **スプリットビュー**: 左側にノートリスト、右側にスレッドビューの2ペインレイアウト
- **ダーク/ライトテーマ**: ワンクリックでテーマ切り替え可能
- **レスポンシブデザイン**: モバイル・デスクトップ両対応
- **shadcn/ui コンポーネント**: モダンなUIコンポーネントライブラリ採用
- **スマートオートフォーカス**: スレッド返信時の自動フォーカス機能
- **Cmd/Ctrl+Enter 送信**: キーボードショートカットでの送信

### Desktop App

- **Electron デスクトップアプリ**: macOS 向けスタンドアロンアプリ
- **クロスプラットフォーム対応準備**: Electron ベースで将来の拡張性確保

### Authentication

- **Clerk 認証統合**: セキュアなユーザー認証
- **ユーザー同期サービス**: Clerk とバックエンドのユーザー情報同期
- **認証ミドルウェア**: 全 API エンドポイントの保護

### Deployment

- **Cloudflare Workers**: バックエンドのエッジデプロイ
- **Cloudflare Pages**: フロントエンドの静的ホスティング
- **Staging/Production 環境**: 環境別デプロイ設定
- **GitHub Actions CI/CD**: 自動テスト・デプロイパイプライン

---

## 🛠 Technical Stack

### Backend

- **Runtime**: Bun
- **Framework**: Hono v4 (Cloudflare Workers 対応)
- **Database**: SQLite / Cloudflare D1
- **ORM**: Drizzle ORM
- **Type Safety**: Hono RPC によるフルスタック型安全性

### Frontend

- **Framework**: React 18
- **State Management**: TanStack Query
- **UI Components**: shadcn/ui + Tailwind CSS
- **API Client**: Hono RPC Client

### Testing

- **Unit Tests**: Bun Test (Vitest から移行)
- **E2E Tests**: Playwright
- **Contract Tests**: 型安全な API テスト

---

## 📦 API Endpoints

```
GET    /api/notes              # ルートノート一覧取得
POST   /api/notes              # ノート作成
GET    /api/notes/:id          # スレッド付きノート取得
PUT    /api/notes/:id          # ノート更新
DELETE /api/notes/:id          # ノート削除（カスケード）
GET    /api/notes/search       # ノート検索
GET    /api/notes/:id/mentions # メンション取得
POST   /api/users/sync         # ユーザー同期
```

---

## 🔒 Security

- DOMPurify によるコンテンツサニタイズ
- CSP ヘッダー有効化
- 全エンドポイントの入力バリデーション
- SQL インジェクション対策
- XSS 対策

---

## 📝 Breaking Changes

なし（初回リリース）

---

## 🐛 Known Issues

なし

---

## 🙏 Contributors

- ta21cos
- Claude (AI Assistant)

---

## 📚 Documentation

- [README.md](./README.md) - プロジェクト概要と使い方
- [specs/](./specs/) - 機能仕様書

---

**Full Changelog**: https://github.com/ta21cos/thread-type-note-app/commits/v1.0.0
