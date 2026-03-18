# Deep Plan: Stock + Note 機能

> Updated at: 2026-03-17 23:55
> Source: PLAN.md (Updated at: 2026-03-17 23:45)

## How to Use

- `[RESOLVED]` — 既存コードから判断済み。参考パターンを記載
- `[DECISION NEEDED]` — あなたの判断が必要。placeholder を埋めてください
- `[INFERRED]` — 既存パターンから推測。確認推奨

---

## PR 1/3: Schema + Notes

### Step 1: スキーマ定義

#### Processing Order

**PO-1.1: stocks と stockTags の作成順序** `[RESOLVED]`

> 制約: stockTags.stockId が stocks.id を参照する FK 制約

```
1. stocks テーブル定義 — 先に作成（FK 参照元）
2. stockTags テーブル定義 — stocks.id を参照
3. posts に isPromoted カラム追加
```

参考 (`src/db/schema.ts:79-116`): posts → postReplies の順序と同じパターン

#### Domain Knowledge

**DK-1.1: stockTags の UNIQUE 制約の Drizzle 定義方法** `[RESOLVED]`

> 状況: `UNIQUE(stock_id, tag)` を Drizzle で定義する方法

```typescript
import { unique } from "drizzle-orm/pg-core";
// テーブル定義の第3引数で:
(table) => [
  unique().on(table.stockId, table.tag),
  // ... RLS ポリシー
]
```

参考: Drizzle ORM ドキュメントの composite unique constraint パターン

---

### Step 3: stocks.ts CRUD

#### Branching Decisions

**BD-1.1: createNote のバリデーション — タイトル必須か** `[RESOLVED]`

> 状況: ノート作成時にタイトルが空の場合のハンドリング

既存パターン（`createChannel` の name バリデーション）に準拠:
```typescript
if (!title?.trim()) {
  return { error: "Title is required" };
}
```

参考 (`src/app/actions/channels.ts:37-39`): `if (!name?.trim()) return { error: "Channel name is required" };`

**BD-1.2: deleteNote 時の stockTags の削除** `[RESOLVED]`

> 制約: stockTags は `ON DELETE CASCADE` で定義するため、stocks 削除時に自動削除

参考 (`src/db/schema.ts:124`): postReplies の `onDelete: "cascade"` と同じパターン

#### Domain Knowledge

**DK-1.2: グループなし（未分類）ノートの表示ラベル** `[DECISION NEEDED]` <!-- DECISION NEEDED -->

> 状況: `group` が NULL のノートをどう表示するか

選択肢:
- **A:** 「未分類」ラベルの下にまとめる ← First suggestion
- **B:** グループ見出しなしでフラットに表示
- **C:** 「未分類」グループに自動割り当て（DB 上も）

> **決定:** __________
> **理由:** __________

---

### Step 4-5: tag-input / group-select コンポーネント

#### Branching Decisions

**BD-1.3: タグ入力の UI パターン** `[INFERRED]`

> 状況: shadcn/ui に Select/Dropdown/Popover コンポーネントが未インストール。タグ入力のサジェスト UI をどう実装するか

推測:
- Input フィールド + フォーカス時にサジェストリストを表示するカスタム UI
- cmdk (CommandDialog) を流用してポップオーバー的に使う方法もあるが、インラインでは重い
- 最もシンプルな方法: Input + 条件付き `<ul>` ドロップダウン（CSS absolute positioning）

参考 (`src/components/search-modal.tsx`): CommandDialog + CommandInput + CommandList の既存パターン。ただし full-screen modal のみ

**BD-1.4: グループ選択の UI パターン** `[INFERRED]`

> 状況: 既存グループのサジェスト + 新規グループ入力を1つの UI で提供

推測:
- Input フィールド + 入力時に既存グループをフィルタリング表示
- Enter で確定（既存マッチ or 新規作成）
- tag-input と同様の CSS ドロップダウンパターン

---

### Step 10-11: サイドバー Notes セクション

#### Domain Knowledge

**DK-1.3: サイドバーのノート表示量の制限** `[DECISION NEEDED]` <!-- DECISION NEEDED -->

> 状況: ノートが大量にある場合、サイドバーにすべて表示すると見づらくなる

選択肢:
- **A:** グループ名のみ表示し、クリックで `/notes?group=xxx` に遷移 ← First suggestion
- **B:** グループ別に折りたたみ可能なアコーディオンで全ノート表示
- **C:** 最新 N 件のみ表示 + 「すべて見る」リンク

> **決定:** __________
> **理由:** __________

---

## PR 2/3: Promotion + Inbox

### Step 3-4: post-item / post-list の変更

#### Branching Decisions

**BD-2.1: 選択モードの開始/終了方法** `[DECISION NEEDED]` <!-- DECISION NEEDED -->

> 状況: 複数投稿を選択して一括昇格する際の UX

選択肢:
- **A:** 長押し or チェックボックスアイコンボタンで選択モードに入り、選択後に「N件を昇格」バー表示 ← First suggestion
- **B:** Shift+Click で範囲選択（Slack 的）
- **C:** 各投稿のホバーメニューに「選択」ボタンを追加、1つ選ぶと自動で選択モードに入る

> **決定:** __________
> **理由:** __________

**BD-2.2: 既に昇格済みの投稿への対応** `[RESOLVED]`

> 状況: is_promoted = true の投稿に対して昇格ボタンを表示するか

既存パターンから: 昇格ボタンは非表示にし、📌 バッジのみ表示。Server Action 側でも `is_promoted` チェックしてスキップ（二重防止）

#### Domain Knowledge

**DK-2.1: スレッド昇格時の返信取得範囲** `[RESOLVED]`

> 状況: promoteThread で対象になる返信の範囲

```
1. 親投稿（posts テーブル）を取得
2. その postId に紐づく全 postReplies を取得
3. 時系列順に結合
```

参考 (`src/components/thread-panel.tsx:244-247`): `Promise.all([getPost(postId), getReplies(postId)])` パターンと同じ

---

### Step 7: move-to-note-modal

#### Branching Decisions

**BD-2.3: インボックスからノートへの移動 UI フロー** `[RESOLVED]`

> 状況: 「ノートに移動」ボタンを押した後の遷移

既存の CommandDialog パターンを再利用:
```
1. ボタンクリック → CommandDialog オープン
2. 「新規ノートとして保存」選択 → moveToNote (UPDATE status='note') → Dialog 閉じる
3. 既存ノート検索 → 選択 → mergeIntoNote → Dialog 閉じる
```

参考 (`src/components/search-modal.tsx`): CommandDialog + 検索 + 結果選択 → 遷移のパターン

---

## PR 3/3: Search Extension

### Step 1-2: 検索拡張

#### Processing Order

**PO-3.1: searchAll の統合方法** `[RESOLVED]`

> 制約: 既存の searchPosts は posts + postReplies を個別クエリで取得してマージ

```
1. 既存の searchPosts をそのまま維持（後方互換）
2. searchStocks を新規追加（stocks テーブル対象）
3. searchAll = searchPosts の結果 + searchStocks の結果をマージ・ソート
```

参考 (`src/app/actions/search.ts:61-68`): 既存の merge + sort パターンをそのまま拡張

#### Domain Knowledge

**DK-3.1: ノート検索結果の表示情報** `[RESOLVED]`

> 状況: ノートには channelId/channelName がないため、検索結果の表示を調整

```
- type: "note" の場合: 📚 アイコン + グループ名（or "Note"）+ タイムスタンプ
- type: "post"/"reply" の場合: 既存通り # チャンネル名 + タイムスタンプ
```

参考 (`src/components/search-modal.tsx:123-128`): アイコン + メタ情報 + コンテンツの表示パターン

---

## Summary

### Decision Matrix

| ID | Category | PR | Step | Status | Summary |
|----|----------|-----|------|--------|---------|
| PO-1.1 | Order | 1 | 1 | RESOLVED | stocks → stockTags → posts.isPromoted の順 |
| DK-1.1 | Domain | 1 | 1 | RESOLVED | UNIQUE 制約の Drizzle 定義方法 |
| BD-1.1 | Branching | 1 | 3 | RESOLVED | createNote のタイトルバリデーション |
| BD-1.2 | Branching | 1 | 3 | RESOLVED | deleteNote 時の CASCADE 自動削除 |
| DK-1.2 | Domain | 1 | 3 | DECISION NEEDED | グループなしノートの表示ラベル |
| BD-1.3 | Branching | 1 | 4 | INFERRED | タグ入力の UI パターン |
| BD-1.4 | Branching | 1 | 5 | INFERRED | グループ選択の UI パターン |
| DK-1.3 | Domain | 1 | 10 | DECISION NEEDED | サイドバーのノート表示量制限 |
| BD-2.1 | Branching | 2 | 3 | DECISION NEEDED | 選択モードの開始/終了方法 |
| BD-2.2 | Branching | 2 | 3 | RESOLVED | 昇格済み投稿のボタン非表示 |
| DK-2.1 | Domain | 2 | - | RESOLVED | スレッド昇格の返信範囲 |
| BD-2.3 | Branching | 2 | 7 | RESOLVED | ノートへの移動 UI フロー |
| PO-3.1 | Order | 3 | 1 | RESOLVED | searchAll の統合方法 |
| DK-3.1 | Domain | 3 | 2 | RESOLVED | ノート検索結果の表示 |

### Statistics
- Total: 14 / Resolved: 10 / Inferred: 2 / Decision needed: 3 (DK-1.2, DK-1.3, BD-2.1)
