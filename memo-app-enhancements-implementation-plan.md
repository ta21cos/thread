# Memo App Enhancements - Implementation Plan

> Saved from Claude Code conversation on 2026-01-31

## Summary

Thread メモアプリに5つの新機能を追加するための包括的な実装計画。エンジニア向けのキーボードファースト UX を重視し、1万ユーザーにスケールするパフォーマンス設計を含む。

---

## 機能概要

### 1. チャネル (Channels)

- 既存の `isHidden` を置き換え
- ノートを複数のチャネルに分類（仕事、趣味、家計など）
- キーボードで瞬時に切り替え (`Cmd+1~9`)
- チャネルごとに色とアイコンを設定可能

### 2. ブックマーク (Bookmarks)

- 重要なノートをマーク (`Cmd+Shift+B`)
- 専用のブックマークビュー (`Cmd+B`)
- ドラッグで並び替え可能

### 3. TODO タスク (Tasks)

- ノート内の `- [ ]` 構文を自動パース
- クリックまたは `Cmd+Enter` でトグル
- 専用のタスクビュー (`Cmd+T`)
- チャネルごとにフィルタ可能

### 4. クイックノート (Scratch Pad)

- スライドアウト式のメモ欄 (`Cmd+/`)
- 自動保存（500msデバウンス）
- 正式なノートに変換可能
- チャネルごとに独立

### 5. 日記 (Daily Notes)

- 日付ごとに自動生成 (`Cmd+D` で今日を開く)
- カレンダーで過去の日記にアクセス
- テンプレートでゼロから書かない
- チャネルのノートを `@` で参照可能

---

## データベーススキーマ

### 新規テーブル

```sql
-- channels: ノートのグループ化
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'hash',
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
CREATE INDEX idx_channels_author_sort ON channels(author_id, sort_order);

-- bookmarks: ノートのブックマーク
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(note_id, author_id)
);
CREATE INDEX idx_bookmarks_author ON bookmarks(author_id, created_at DESC);

-- tasks: ノートから抽出したタスク
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_completed INTEGER DEFAULT 0 NOT NULL,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
CREATE INDEX idx_tasks_author_status ON tasks(author_id, is_completed, created_at DESC);
CREATE INDEX idx_tasks_note ON tasks(note_id);

-- scratch_pads: クイックノート
CREATE TABLE scratch_pads (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(author_id, channel_id)
);

-- daily_notes: 日記とノートのマッピング
CREATE TABLE daily_notes (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(author_id, date)
);
CREATE INDEX idx_daily_notes_date ON daily_notes(date);

-- templates: 日記テンプレート
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
```

### notes テーブルの変更

```sql
ALTER TABLE notes ADD COLUMN channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL;
CREATE INDEX idx_notes_channel ON notes(channel_id, created_at DESC);
CREATE INDEX idx_notes_parent_count ON notes(parent_id) WHERE parent_id IS NOT NULL;
```

---

## API エンドポイント

| メソッド | パス                                   | 説明                 |
| -------- | -------------------------------------- | -------------------- |
| GET      | /api/channels                          | チャネル一覧         |
| POST     | /api/channels                          | チャネル作成         |
| PUT      | /api/channels/:id                      | チャネル更新         |
| DELETE   | /api/channels/:id                      | チャネル削除         |
| GET      | /api/bookmarks                         | ブックマーク一覧     |
| POST     | /api/notes/:id/bookmark                | ブックマーク切替     |
| GET      | /api/tasks                             | タスク一覧           |
| PATCH    | /api/tasks/:id/toggle                  | タスク完了切替       |
| GET      | /api/scratch-pad                       | スクラッチパッド取得 |
| PUT      | /api/scratch-pad                       | スクラッチパッド更新 |
| POST     | /api/scratch-pad/convert               | ノートに変換         |
| GET      | /api/daily-notes/:date                 | 日記取得/作成        |
| GET      | /api/daily-notes/calendar/:year/:month | カレンダー           |
| GET      | /api/templates                         | テンプレート一覧     |
| POST     | /api/templates                         | テンプレート作成     |

---

## キーボードショートカット

| ショートカット    | アクション                 |
| ----------------- | -------------------------- |
| `Cmd+1~9`         | チャネル切り替え           |
| `Cmd+/`           | スクラッチパッド開閉       |
| `Cmd+D`           | 今日の日記を開く           |
| `Cmd+B`           | ブックマーク一覧           |
| `Cmd+T`           | タスク一覧                 |
| `Cmd+Shift+B`     | 現在のノートをブックマーク |
| `Cmd+Enter`       | ノート送信                 |
| `Cmd+[` / `Cmd+]` | 前日/翌日の日記            |
| `J` / `K`         | ノートリスト上下移動       |

---

## フロントエンド構造

```
frontend/src/
├── components/
│   ├── channels/
│   │   ├── ChannelList.tsx        # サイドバーのチャネル一覧
│   │   ├── ChannelItem.tsx        # チャネルアイテム
│   │   └── ChannelDialog.tsx      # 作成/編集ダイアログ
│   ├── bookmarks/
│   │   ├── BookmarkButton.tsx     # ブックマークトグル
│   │   └── BookmarksView.tsx      # ブックマーク一覧
│   ├── tasks/
│   │   ├── TaskCheckbox.tsx       # インタラクティブチェックボックス
│   │   └── TasksView.tsx          # タスク一覧
│   ├── scratch-pad/
│   │   └── ScratchPadPanel.tsx    # スライドアウトパネル
│   └── daily-notes/
│       ├── DailyNotesView.tsx     # 日記ビュー
│       └── CalendarWidget.tsx     # カレンダー
├── pages/
│   ├── BookmarksPage.tsx
│   ├── TasksPage.tsx
│   └── DailyNotesPage.tsx
├── services/
│   ├── channel.service.ts
│   ├── bookmark.service.ts
│   ├── task.service.ts
│   ├── scratch-pad.service.ts
│   └── daily-note.service.ts
└── store/
    ├── channel.store.tsx
    └── keyboard.store.tsx
```

---

## パフォーマンス最適化

### N+1 問題の解決

```typescript
// バッチクエリでブックマーク状態を取得
const getNotesWithBookmarks = async (authorId: string, channelId: string) => {
  return db
    .select({
      ...notes,
      replyCount: sql`(SELECT COUNT(*) FROM notes n2 WHERE n2.parent_id = notes.id)`,
      isBookmarked: sql`EXISTS(SELECT 1 FROM bookmarks WHERE note_id = notes.id AND author_id = ${authorId})`,
    })
    .from(notes)
    .where(and(eq(notes.channelId, channelId), isNull(notes.parentId)))
    .orderBy(desc(notes.createdAt));
};
```

### フロントエンド最適化

- React Query で5分間のキャッシュ
- Optimistic updates でブックマーク/タスク切替
- デバウンス保存でスクラッチパッド
- localStorage で UI 状態永続化

---

## 実装フェーズ

### Phase 1: チャネル基盤

- チャネルスキーマ・マイグレーション
- チャネルサービス + ユニットテスト
- チャネル API
- フロントエンド UI

### Phase 2: isHidden マイグレーション

- マイグレーションスクリプト
- 後方互換性レイヤー削除

### Phase 3: ブックマーク

- ブックマークスキーマ・サービス + テスト
- API エンドポイント
- フロントエンド UI

### Phase 4: TODO タスク

- タスクパーサー + テスト
- タスクサービス + テスト
- API エンドポイント
- フロントエンド UI

### Phase 5: クイックノート

- スクラッチパッドスキーマ・サービス
- API エンドポイント
- スライドアウトパネル UI

### Phase 6: 日記

- 日記・テンプレートスキーマ
- API エンドポイント
- カレンダー・日記ビュー

### Phase 7: 仕上げ

- 全キーボードショートカット
- E2E テスト
- パフォーマンステスト

---

## Key Points

- **キーボードファースト**: マウスに手を伸ばす時間を最小化
- **自動保存**: 保存を忘れて消える恐怖をなくす
- **Markdown ネイティブ**: 学習コストゼロ
- **N+1 解決**: JOINとサブクエリでバッチ取得
- **適切なインデックス**: 1万ノートでも <100ms
- **TDD**: 各サービスにユニットテスト
- **意味のあるコミット**: フェーズごとに3-4コミット
