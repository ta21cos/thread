# Memo App Enhancements - Implementation Plan

> Saved from Claude Code conversation on 2026-01-31

## Summary

Thread メモアプリに5つの新機能を追加するための包括的な実装計画。エンジニア向けのキーボードファースト UX を重視し、1万ユーザーにスケールするパフォーマンス設計を含む。

---

## 決定事項

1. **日記の位置づけ**: チャネルとは独立した機能。1つの日記で全チャネルのノートを `@` 参照可能
2. **タスク抽出**: ノート保存時に自動抽出・同期
3. **デフォルトチャネル**: 新規ユーザーには「General」チャネルを自動作成

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

### マイグレーション戦略

1. `isHidden = true` のノートを持つユーザーに「プライベート」チャネルを作成
2. 全ノートをデフォルトチャネル「General」に割り当て
3. 検証後に `is_hidden` カラムを削除

---

## バックエンド実装

### ディレクトリ構造

```
backend/src/
├── models/
│   ├── channel.schema.ts      # 新規
│   ├── bookmark.schema.ts     # 新規
│   ├── task.schema.ts         # 新規
│   ├── scratch-pad.schema.ts  # 新規
│   ├── daily-note.schema.ts   # 新規
│   └── template.schema.ts     # 新規
├── repositories/
│   ├── channel.repository.ts  # 新規
│   ├── bookmark.repository.ts # 新規
│   ├── task.repository.ts     # 新規
│   ├── scratch-pad.repository.ts # 新規
│   └── daily-note.repository.ts  # 新規
├── services/
│   ├── channel/
│   │   ├── channel.service.ts
│   │   ├── channel.service.spec.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── bookmark/
│   ├── task/
│   ├── scratch-pad/
│   └── daily-note/
├── api/routes/
│   ├── channels.ts            # 新規
│   ├── bookmarks.ts           # 新規
│   ├── tasks.ts               # 新規
│   ├── scratch-pad.ts         # 新規
│   └── daily-notes.ts         # 新規
└── utils/
    └── task-parser.ts         # タスク構文パーサー
```

### API エンドポイント

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

### パフォーマンス最適化

```typescript
// N+1 問題の解決: バッチクエリでブックマーク状態を取得
const getNotesWithBookmarks = async (
  authorId: string,
  channelId: string,
  limit: number,
  offset: number
) => {
  return db
    .select({
      ...notes,
      replyCount: sql`(SELECT COUNT(*) FROM notes n2 WHERE n2.parent_id = notes.id)`,
      isBookmarked: sql`EXISTS(SELECT 1 FROM bookmarks WHERE bookmarks.note_id = notes.id AND bookmarks.author_id = ${authorId})`,
    })
    .from(notes)
    .where(and(eq(notes.channelId, channelId), isNull(notes.parentId)))
    .orderBy(desc(notes.createdAt))
    .limit(limit)
    .offset(offset);
};
```

---

## フロントエンド実装

### コンポーネント構造

```
frontend/src/
├── components/
│   ├── channels/
│   │   ├── ChannelList.tsx        # サイドバーのチャネル一覧
│   │   ├── ChannelItem.tsx        # チャネルアイテム
│   │   ├── ChannelDialog.tsx      # 作成/編集ダイアログ
│   │   └── ChannelColorPicker.tsx # カラーピッカー
│   ├── bookmarks/
│   │   ├── BookmarkButton.tsx     # ブックマークトグル
│   │   └── BookmarksView.tsx      # ブックマーク一覧
│   ├── tasks/
│   │   ├── TaskCheckbox.tsx       # インタラクティブチェックボックス
│   │   ├── TasksView.tsx          # タスク一覧
│   │   └── TaskItem.tsx           # タスクアイテム
│   ├── scratch-pad/
│   │   ├── ScratchPadPanel.tsx    # スライドアウトパネル
│   │   └── ScratchPadEditor.tsx   # 自動保存エディタ
│   └── daily-notes/
│       ├── DailyNotesView.tsx     # 日記ビュー
│       ├── CalendarWidget.tsx     # カレンダー
│       └── TemplateSelector.tsx   # テンプレート選択
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
    ├── channel.store.tsx          # 現在のチャネル状態
    └── keyboard.store.tsx         # キーボードショートカット
```

### キーボードショートカット

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

### ルーティング

```typescript
const routes = [
  { path: '/', element: <NotesPage /> },
  { path: '/notes/:noteId', element: <NotesPage /> },
  { path: '/channels/:channelId', element: <NotesPage /> },
  { path: '/bookmarks', element: <BookmarksPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/daily', element: <DailyNotesPage /> },
  { path: '/daily/:date', element: <DailyNotesPage /> },
];
```

---

## 実装フェーズ

### Phase 1: チャネル基盤 (コミット単位: 3-4)

1. チャネルスキーマとマイグレーション作成
2. チャネルリポジトリ・サービス実装 + ユニットテスト
3. チャネル API エンドポイント実装
4. フロントエンド: チャネルリスト、切り替え UI

### Phase 2: isHidden マイグレーション (コミット単位: 2)

1. マイグレーションスクリプト作成・実行
2. 後方互換性レイヤー削除

### Phase 3: ブックマーク (コミット単位: 2-3)

1. ブックマークスキーマ・リポジトリ・サービス + テスト
2. ブックマーク API エンドポイント
3. フロントエンド: ブックマークボタン、一覧ビュー

### Phase 4: TODO タスク (コミット単位: 3-4)

1. タスクパーサーユーティリティ + テスト
2. タスクスキーマ・リポジトリ・サービス + テスト
3. タスク API エンドポイント
4. フロントエンド: チェックボックス、タスクビュー

### Phase 5: クイックノート (コミット単位: 2-3)

1. スクラッチパッドスキーマ・サービス + テスト
2. スクラッチパッド API エンドポイント
3. フロントエンド: スライドアウトパネル、自動保存

### Phase 6: 日記 (コミット単位: 3-4)

1. 日記・テンプレートスキーマ・サービス + テスト
2. 日記 API エンドポイント
3. フロントエンド: カレンダー、日記ビュー
4. テンプレートプレースホルダー処理

### Phase 7: 仕上げ (コミット単位: 2)

1. キーボードショートカット全実装
2. E2E テスト、パフォーマンステスト

---

## 変更が必要な既存ファイル

### バックエンド

- `backend/src/models/note.schema.ts` - channelId 追加
- `backend/src/models/index.ts` - 新スキーマのエクスポート
- `backend/src/repositories/note.repository.ts` - チャネルフィルタリング追加
- `backend/src/services/note/note.service.ts` - タスク同期、チャネル対応
- `backend/src/api/routes/notes.ts` - channelId クエリパラメータ
- `backend/src/api/routes/index.ts` - 新ルートの登録

### フロントエンド

- `frontend/src/App.tsx` - 新 Provider、ルート追加
- `frontend/src/pages/NotesPage.tsx` - チャネルコンテキスト統合
- `frontend/src/components/NoteList.tsx` - ブックマーク表示、チャネルフィルタ
- `frontend/src/components/ThreadView.tsx` - ブックマークボタン、タスクチェックボックス
- `frontend/src/components/NoteEditor.tsx` - タスク構文サポート
- `frontend/src/services/note.service.ts` - ブックマーク状態の取得

---

## テスト戦略

### ユニットテスト

- 各サービスの `*.spec.ts` ファイル
- タスクパーサーの境界ケース
- ResultAsync のエラーハンドリング

### E2E テスト (Playwright)

- `frontend/tests/e2e/07-channels.spec.ts`
- `frontend/tests/e2e/08-bookmarks.spec.ts`
- `frontend/tests/e2e/09-tasks.spec.ts`
- `frontend/tests/e2e/10-scratch-pad.spec.ts`
- `frontend/tests/e2e/11-daily-notes.spec.ts`

### パフォーマンステスト

- 1万ノートでのクエリ応答時間 < 100ms
- 無限スクロールのスムーズさ

---

## Verification（動作確認）

### ユニットテスト

```bash
bun test
```

### E2E テスト (Playwright)

```bash
bun run test:e2e
```

### 手動確認項目

#### チャネル

- [ ] チャネル作成・編集・削除ができる
- [ ] `Cmd+1~9` でチャネル切り替えができる
- [ ] ノートがチャネルに紐づく

#### ブックマーク

- [ ] ノートをブックマーク/解除できる
- [ ] `Cmd+B` でブックマーク一覧が開く
- [ ] `Cmd+Shift+B` で現在のノートをブックマーク

#### タスク

- [ ] `- [ ]` がチェックボックスとして表示される
- [ ] クリックで完了/未完了を切り替えられる
- [ ] `Cmd+T` でタスク一覧が開く

#### クイックノート

- [ ] `Cmd+/` でスクラッチパッドが開閉する
- [ ] 自動保存される（Saved 表示）
- [ ] 「ノートに変換」でノートが作成される

#### 日記

- [ ] `Cmd+D` で今日の日記が開く
- [ ] カレンダーで過去の日記にアクセスできる
- [ ] テンプレートが適用される
- [ ] `@noteId` で他のノートを参照できる

---

## Key Points

- **キーボードファースト**: マウスに手を伸ばす時間を最小化
- **自動保存**: 保存を忘れて消える恐怖をなくす
- **Markdown ネイティブ**: 学習コストゼロ
- **N+1 解決**: JOINとサブクエリでバッチ取得
- **適切なインデックス**: 1万ノートでも <100ms
- **TDD**: 各サービスにユニットテスト
- **意味のあるコミット**: フェーズごとに3-4コミット
- **日記はチャネルと独立**: 全チャネルのノートを `@` 参照可能
- **タスクは自動抽出**: ノート保存時にパースして DB に保存
