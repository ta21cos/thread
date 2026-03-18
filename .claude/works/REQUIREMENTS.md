# Requirements: Stock + Note 機能（Flow×Stock PKM Phase 2）

## Goal

既存のフロー（チャンネル + 投稿 + スレッド）に「昇格 → インボックス → ノート」のストック化パイプラインを追加する。
書き捨ての投稿が知識として蓄積されるデータ導線を実現する。

## Constraints

- 既存の技術スタック（Next.js 15 App Router + Drizzle ORM + PostgreSQL + Supabase Auth + shadcn/ui）
- Server Actions のみ、API Routes 不使用
- Drizzle Kit マイグレーション（`drizzle/` ディレクトリに SQL 生成）
- 既存テーブルに RLS ポリシーあり — 新規テーブルにも同様に設定
- 認証は Supabase Auth + profiles テーブル（authorId で所有者管理）
- 既存の Phase 1 コードを壊さない
- 新規パッケージ追加なし（既存の cmdk / shadcn/ui で実装）
- 検索は PostgreSQL `pg_trgm`（`similarity()` / `%` 演算子）を使用（FTS5 は SQLite 固有）

## Functional Requirements

### ノート（ストック）
- [ ] FR-1: ノート一覧ページ（`/notes`）— グループ別表示
- [ ] FR-2: ノート詳細ページ（`/notes/[id]`）— Markdown エディタ（textarea ベース）
- [ ] FR-3: ノートの作成（タイトル、内容、グループ、タグ）
- [ ] FR-4: ノートの編集（タイトル、内容、グループ、タグ）
- [ ] FR-5: ノートの削除
- [ ] FR-6: グループ管理 — 1階層グループ、動的追加、既存グループサジェスト
- [ ] FR-7: タグ管理 — 自由入力 + 過去タグサジェスト、複数タグ対応、小文字正規化
- [ ] FR-8: サイドバーに「📚 Notes」セクション（グループ別ツリー表示）

### 昇格（Promotion）
- [ ] FR-9: 投稿1件を昇格（インボックスに送る）
- [ ] FR-10: スレッド（親投稿 + 返信）をまとめて昇格
- [ ] FR-11: 複数投稿を選択してまとめて昇格
- [ ] FR-12: 昇格済み投稿に「📌 Stocked」バッジ表示
- [ ] FR-13: 昇格時にタイトルを任意で入力可能（デフォルト: 投稿冒頭）

### インボックス
- [ ] FR-14: インボックスページ（`/inbox`）で昇格済みアイテム一覧表示
- [ ] FR-15: サイドバーに「📥 Inbox」を表示（未処理件数バッジ付き）
- [ ] FR-16: インボックスアイテムから元投稿へのジャンプリンク
- [ ] FR-17: インボックスアイテムをノートに移動（既存ノートに追記 or 新規ノート作成）
- [ ] FR-18: 複数アイテムを選択して一括移動
- [ ] FR-19: インボックスアイテムの削除（不要なものを破棄）

### 検索拡張
- [ ] FR-20: グローバル検索（Cmd+K）をノートにも対応（フロー + ストック横断検索）

## Data Model

### 設計方針

posts（フロー）と stocks（ストック）の2系統に分離。
inbox と note は同一テーブル `stocks` で管理し、`status` ('inbox' | 'note') で区別する。
理由: inbox は note の前段階であり、ノート化は UPDATE 1発で表現できる。

### 新規テーブル

```sql
-- ストック（inbox + note 統合）
stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'inbox',      -- 'inbox' | 'note'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "group" TEXT,                               -- inbox 時は NULL、note 化で設定
  source_post_ids TEXT NOT NULL DEFAULT '[]', -- JSON array of post IDs
  source_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- ストックのタグ（多対多）
stock_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(stock_id, tag)
)
```

### 既存テーブルの変更

```sql
-- posts テーブルに昇格フラグ追加
ALTER TABLE posts ADD COLUMN is_promoted BOOLEAN NOT NULL DEFAULT false;
```

### RLS ポリシー

stocks, stock_tags ともに既存テーブルと同様のパターンで RLS を設定:
- SELECT/INSERT/UPDATE/DELETE すべて `auth.uid()` と `author_id` 経由の profiles 照合

## Non-Functional Requirements

- [ ] NFR-1: インボックスからノートへの移動は3クリック以内
- [ ] NFR-2: 既存 Phase 1 機能が壊れないこと

## Out of Scope

- タグ管理画面（リネーム・マージ）— 将来
- ノート成熟度ステータス（seed/budding/evergreen）— 将来
- バックリンク `[[記法]]` — 将来
- AIアシスト — 将来
- インボックス放置通知 — 将来

## Assumptions

- グループ名は自由テキスト（事前定義なし）
- タグは小文字に正規化して保存
- ノートの Markdown エディタは textarea ベース
- 昇格元の投稿 ID は JSON 配列で保持（PostgreSQL の TEXT カラム）
