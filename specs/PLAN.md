# New Features Frontend Implementation

> Created: 2026-02-08 18:00
> Last Updated: 2026-02-08 18:00
> Status: 🔵 In Progress

## Goal

5つの新機能 (Channels, Bookmarks, Tasks, Scratch Pad, Daily Notes) のフロントエンドUIを実装し、既存のバックエンドAPIと接続する。仕様書 `memo-app-implementation-plan.md` と `memo-app-enhancements-implementation-plan.md` に従う。

## Requirements

- [ ] Channels: サイドバーにチャネル一覧を表示し、チャネルごとにノートをフィルタリング
- [ ] Bookmarks: ノートのブックマーク機能 + 専用ページ
- [ ] Tasks: ノート内の `- [ ]` をインタラクティブチェックボックス化 + 専用ページ
- [ ] Scratch Pad: スライドアウト式クイックメモ + 自動保存
- [ ] Daily Notes: 日記機能 + カレンダー + テンプレート
- [ ] Keyboard Shortcuts: 全機能のキーボードショートカット
- [ ] Routing: 各機能ページへのルート追加
- [ ] Mobile Responsive: 既存のSplitViewパターンに合わせたモバイル対応

## Implementation Plan

### Phase 1: Infrastructure (基盤整備)

**Status:** ⬜ Not Started

ルーティング、サイドバーナビゲーション、キーボードショートカットの基盤を整備。

#### Tasks:

- [ ] 1-1. ルーター拡張
  - `frontend/src/router/index.tsx` に新ルート追加
  - `/channels/:channelId` → NotesPage (チャネルフィルタ付き)
  - `/bookmarks` → BookmarksPage
  - `/tasks` → TasksPage
  - `/daily` → DailyNotesPage
  - `/daily/:date` → DailyNotesPage

- [ ] 1-2. サイドバーナビゲーション作成
  - `frontend/src/components/layout/Sidebar.tsx` 新規作成
  - ChannelList を組み込み
  - ナビゲーションリンク: Bookmarks, Tasks, Daily Notes
  - SplitView の left パネルを Sidebar + NoteList に変更
  - レスポンシブ: モバイルではハンバーガーメニュー or ボトムナビ

- [ ] 1-3. キーボードショートカット基盤
  - `frontend/src/hooks/useKeyboardShortcuts.ts` 新規作成
  - グローバルなキーイベントハンドラー
  - ショートカット登録/解除のAPI
  - テキスト入力中はショートカット無効化
  - App.tsx または NotesPage で useKeyboardShortcuts を呼び出す

- [ ] 1-4. NotesPage のチャネルフィルタ対応
  - `useParams` から `channelId` を取得
  - `useInfiniteNotes` にチャネルフィルタパラメータ追加
  - `note.service.ts` の `useInfiniteNotes` に `channelId` オプション追加

### Phase 2: Channels (チャネル機能完成)

**Status:** ⬜ Not Started

既存の ChannelList, ChannelDialog コンポーネントをUIに統合。

#### Tasks:

- [ ] 2-1. ChannelList をサイドバーに統合
  - Phase 1 で作成した Sidebar コンポーネントに ChannelList を配置
  - チャネル選択時に `/channels/:channelId` にナビゲート
  - 選択状態を URL と同期

- [ ] 2-2. ノート作成時のチャネル紐付け
  - NoteEditor に現在のチャネルIDを渡す
  - `useCreateNote` の DTO に `channelId` を追加
  - note.service.ts の createNote に channelId パラメータ追加

- [ ] 2-3. チャネル切り替えショートカット
  - `Cmd+1~9` でチャネル切り替え
  - useKeyboardShortcuts にチャネル切り替えハンドラー登録

- [ ] 2-4. デフォルトチャネル自動作成
  - アプリ初回読み込み時に `useEnsureDefaultChannel` を呼び出す
  - チャネルが0件の場合 "General" を自動作成

### Phase 3: Bookmarks (ブックマーク機能)

**Status:** ⬜ Not Started

既存の BookmarkButton を統合し、BookmarksPage を新規作成。

#### Tasks:

- [ ] 3-1. BookmarkButton を ThreadView に統合
  - ThreadView のルートノートとリプライにブックマークボタン追加
  - 既存の BookmarkButton コンポーネントを使用
  - ドロップダウンメニューの "Bookmark" をアクション実行に接続

- [ ] 3-2. NoteList にブックマーク状態表示
  - NoteItem にブックマークアイコン表示（小さく）
  - `useInfiniteNotes` のレスポンスに `bookmarked` フラグ含める（バックエンド対応済みの場合）

- [ ] 3-3. BookmarksPage 新規作成
  - `frontend/src/pages/BookmarksPage.tsx` 新規作成
  - `useBookmarks` フックでブックマーク一覧取得
  - NoteItem と同じカードUIで表示
  - クリックでノートの ThreadView に遷移
  - 空状態メッセージ

- [ ] 3-4. ブックマークショートカット
  - `Cmd+B` → `/bookmarks` ページへ遷移
  - `Cmd+Shift+B` → 現在選択中のノートをブックマークトグル

### Phase 4: Tasks (タスク機能)

**Status:** ⬜ Not Started

フロントエンド完全新規作成。

#### Tasks:

- [ ] 4-1. task.service.ts 作成
  - `frontend/src/services/task.service.ts` 新規作成
  - 既存の service パターンに従う（Query keys, hooks）
  - `useTasks(options?)` → GET /api/tasks
  - `useToggleTask()` → PATCH /api/tasks/:id/toggle
  - Optimistic update でチェックボックストグル

- [ ] 4-2. TaskCheckbox コンポーネント
  - `frontend/src/components/tasks/TaskCheckbox.tsx` 新規作成
  - ノートコンテンツ内の `- [ ]` / `- [x]` をインタラクティブチェックボックスに変換
  - クリックで useToggleTask を呼び出し
  - アニメーション付き（完了時にストライクスルー）

- [ ] 4-3. ThreadView でのタスク表示
  - ThreadView のノートコンテンツレンダリングに TaskCheckbox を組み込み
  - Markdown パーサーの拡張（`- [ ]` パターン検出）
  - 既存の mentions パースと共存

- [ ] 4-4. TasksPage 新規作成
  - `frontend/src/pages/TasksPage.tsx` 新規作成
  - タスク一覧表示（未完了/完了で分離）
  - チャネルフィルター（オプション）
  - タスクをクリックでソースノートの ThreadView に遷移
  - 空状態メッセージ

- [ ] 4-5. タスクショートカット
  - `Cmd+T` → `/tasks` ページへ遷移

### Phase 5: Scratch Pad (クイックノート)

**Status:** ⬜ Not Started

フロントエンド完全新規作成。

#### Tasks:

- [ ] 5-1. scratch-pad.service.ts 作成
  - `frontend/src/services/scratch-pad.service.ts` 新規作成
  - `useScratchPad(channelId?)` → GET /api/scratch-pad
  - `useUpdateScratchPad()` → PUT /api/scratch-pad
  - `useConvertScratchPad()` → POST /api/scratch-pad/convert

- [ ] 5-2. ScratchPadPanel コンポーネント
  - `frontend/src/components/scratch-pad/ScratchPadPanel.tsx` 新規作成
  - スライドアウトパネル（右端または下部からスライド）
  - 自動保存（500ms デバウンス）
  - 保存状態インジケーター（"Saved" / "Saving..."）
  - 「ノートに変換」ボタン
  - チャネルごとに独立したコンテンツ（selectedChannelId で切り替え）

- [ ] 5-3. ScratchPad の App 統合
  - App.tsx または NotesPage に ScratchPadPanel を配置
  - 開閉状態の管理（Context or local state）
  - アニメーション付きスライドイン/アウト

- [ ] 5-4. スクラッチパッドショートカット
  - `Cmd+/` → ScratchPadPanel 開閉トグル

### Phase 6: Daily Notes (日記機能)

**Status:** ⬜ Not Started

フロントエンド完全新規作成。

#### Tasks:

- [ ] 6-1. daily-note.service.ts 作成
  - `frontend/src/services/daily-note.service.ts` 新規作成
  - `useDailyNote(date)` → GET /api/daily-notes/:date
  - `useCalendar(year, month)` → GET /api/daily-notes/calendar/:year/:month
  - `useTemplates()` → GET /api/daily-notes/templates
  - `useCreateTemplate()` → POST /api/daily-notes/templates
  - `useUpdateTemplate()` → PUT /api/daily-notes/templates/:id
  - `useDeleteTemplate()` → DELETE /api/daily-notes/templates/:id

- [ ] 6-2. CalendarWidget コンポーネント
  - `frontend/src/components/daily-notes/CalendarWidget.tsx` 新規作成
  - 月間カレンダー表示
  - 日記が存在する日をドット表示
  - 日付クリックで `/daily/:date` にナビゲート
  - 前月/翌月ナビゲーション

- [ ] 6-3. DailyNotesPage 新規作成
  - `frontend/src/pages/DailyNotesPage.tsx` 新規作成
  - SplitView: 左にカレンダー + 日記リスト、右に日記コンテンツ
  - 日記コンテンツは通常のノートとして ThreadView で表示
  - テンプレート選択ダイアログ（新規日記作成時）
  - `@noteId` メンション対応（既存のメンションパーサー利用）

- [ ] 6-4. TemplateSelector コンポーネント
  - `frontend/src/components/daily-notes/TemplateSelector.tsx` 新規作成
  - テンプレート一覧表示
  - テンプレート作成/編集/削除
  - デフォルトテンプレート設定

- [ ] 6-5. 日記ショートカット
  - `Cmd+D` → 今日の日記を開く (`/daily/YYYY-MM-DD`)
  - `Cmd+[` / `Cmd+]` → 前日/翌日の日記

### Phase 7: Polish & Testing (仕上げ)

**Status:** ⬜ Not Started

#### Tasks:

- [ ] 7-1. 全ショートカットの統合テスト
  - useKeyboardShortcuts の全ショートカット動作確認
  - コンフリクトがないことの確認

- [ ] 7-2. モバイルレスポンシブ確認
  - Sidebar のモバイル表示
  - 各ページのモバイルレイアウト

- [ ] 7-3. ローディング/エラー状態
  - 全新規ページにローディングスケルトン追加
  - エラー状態のハンドリング

- [ ] 7-4. lint / typecheck / format
  - `bun run lint`
  - `bun run typecheck`
  - `bun run format`

## Technical Details

### Architecture

```
App.tsx
├── QueryClientProvider
├── SettingsProvider
├── ChannelUIProvider
├── NotesUIProvider
├── FocusProvider
├── AuthGuard
│   ├── AppRouter
│   │   ├── / → NotesPage (SplitView: Sidebar+NoteList | ThreadView)
│   │   ├── /notes/:noteId → NotesPage
│   │   ├── /channels/:channelId → NotesPage (filtered)
│   │   ├── /bookmarks → BookmarksPage
│   │   ├── /tasks → TasksPage
│   │   ├── /daily → DailyNotesPage
│   │   └── /daily/:date → DailyNotesPage
│   ├── ChannelDialog (global modal)
│   └── ScratchPadPanel (global slide-out)
```

### New Files to Create

| File                                                       | Description                        |
| ---------------------------------------------------------- | ---------------------------------- |
| `frontend/src/components/layout/Sidebar.tsx`               | サイドバーナビゲーション           |
| `frontend/src/hooks/useKeyboardShortcuts.ts`               | グローバルキーボードショートカット |
| `frontend/src/pages/BookmarksPage.tsx`                     | ブックマーク一覧ページ             |
| `frontend/src/pages/TasksPage.tsx`                         | タスク一覧ページ                   |
| `frontend/src/pages/DailyNotesPage.tsx`                    | 日記ページ                         |
| `frontend/src/services/task.service.ts`                    | タスクAPI hooks                    |
| `frontend/src/services/scratch-pad.service.ts`             | スクラッチパッドAPI hooks          |
| `frontend/src/services/daily-note.service.ts`              | 日記API hooks                      |
| `frontend/src/components/tasks/TaskCheckbox.tsx`           | チェックボックスコンポーネント     |
| `frontend/src/components/tasks/TasksView.tsx`              | タスク一覧表示                     |
| `frontend/src/components/scratch-pad/ScratchPadPanel.tsx`  | スライドアウトパネル               |
| `frontend/src/components/daily-notes/CalendarWidget.tsx`   | カレンダー                         |
| `frontend/src/components/daily-notes/DailyNotesView.tsx`   | 日記ビュー                         |
| `frontend/src/components/daily-notes/TemplateSelector.tsx` | テンプレート選択                   |
| `frontend/src/components/bookmarks/BookmarksView.tsx`      | ブックマーク一覧表示               |

### Existing Files to Modify

| File                                     | Change                                 |
| ---------------------------------------- | -------------------------------------- |
| `frontend/src/router/index.tsx`          | 新ルート追加                           |
| `frontend/src/App.tsx`                   | ScratchPadPanel 配置                   |
| `frontend/src/pages/NotesPage.tsx`       | Sidebar 統合、channelId フィルタ       |
| `frontend/src/components/NoteList.tsx`   | Sidebar 分離、ブックマーク表示         |
| `frontend/src/components/ThreadView.tsx` | BookmarkButton 統合、TaskCheckbox 統合 |
| `frontend/src/services/note.service.ts`  | channelId パラメータ追加               |

### Existing Patterns to Follow

**Service (React Query) pattern:**

```typescript
const fooKeys = {
  all: ['foos'] as const,
  lists: () => [...fooKeys.all, 'list'] as const,
  detail: (id: string) => [...fooKeys.all, 'detail', id] as const,
};

export const useFoos = () => {
  const { get } = useApiClient();
  return useQuery({
    queryKey: fooKeys.lists(),
    queryFn: async () => {
      const data = await get<FooListResponse>('/foos');
      return data.foos;
    },
  });
};
```

**Store (Context) pattern:**

```typescript
const FooUIContext = createContext<FooUIContextType | null>(null);
export const FooUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(initialState);
  const handler = useCallback((...) => setState(...), []);
  return <FooUIContext.Provider value={{ state, handler }}>{children}</FooUIContext.Provider>;
};
export const useFooUI = () => useContext(FooUIContext)!;
```

### Backend API Endpoints (Implemented)

| Method | Path                            | Description          |
| ------ | ------------------------------- | -------------------- |
| GET    | /api/channels                   | チャネル一覧         |
| POST   | /api/channels                   | チャネル作成         |
| PUT    | /api/channels/:id               | チャネル更新         |
| DELETE | /api/channels/:id               | チャネル削除         |
| POST   | /api/channels/default           | デフォルト作成       |
| GET    | /api/bookmarks                  | ブックマーク一覧     |
| POST   | /api/bookmarks/:noteId          | ブックマークトグル   |
| GET    | /api/bookmarks/:noteId          | ブックマーク確認     |
| DELETE | /api/bookmarks/:noteId          | ブックマーク削除     |
| GET    | /api/tasks                      | タスク一覧           |
| PATCH  | /api/tasks/:id/toggle           | タスク完了トグル     |
| GET    | /api/scratch-pad                | スクラッチパッド取得 |
| PUT    | /api/scratch-pad                | スクラッチパッド更新 |
| POST   | /api/scratch-pad/convert        | ノートに変換         |
| GET    | /api/daily-notes/:date          | 日記取得/作成        |
| GET    | /api/daily-notes/calendar/:y/:m | カレンダー           |
| GET    | /api/daily-notes/templates      | テンプレート一覧     |
| POST   | /api/daily-notes/templates      | テンプレート作成     |
| PUT    | /api/daily-notes/templates/:id  | テンプレート更新     |
| DELETE | /api/daily-notes/templates/:id  | テンプレート削除     |

## Constraints & Considerations

- 既存の E2E テスト (34件) を壊さないこと
- 既存の `data-testid` 属性を変更しないこと
- Clerk 認証バイパス (`VITE_E2E_TEST`) に対応すること
- SplitView のレスポンシブ動作を維持すること
- React Query のキャッシュ戦略を既存パターンに合わせる
- Optimistic updates を活用してUXを高速に保つ
- `bun run lint && bun run typecheck && bun run format` をパスすること

## Notes for AI Agents

### Before Starting:

1. このファイルを読んで全体像を把握すること
2. PROGRESS.md で現在の進捗を確認すること
3. CONTEXT.md で必要なコンテキストを確認すること
4. `memo-app-implementation-plan.md` と `memo-app-enhancements-implementation-plan.md` を参照すること

### Execution Guidelines:

- Phase 順に実装すること（Phase 1 → 2 → ... → 7）
- 各タスク完了後、PROGRESS.md を更新すること
- `bun run lint && bun run typecheck` を各 Phase 完了後に実行
- 問題が発生した場合は PROGRESS.md の Blockers セクションに記載
- 大きな設計変更がある場合は PLAN.md を更新

### After Completion:

- 全てのチェックボックスを更新
- PROGRESS.md に完了報告を追記
- `bun run lint && bun run typecheck && bun run format` を実行
