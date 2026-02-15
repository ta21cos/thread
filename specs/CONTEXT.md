# Context Information

> Last Updated: 2026-02-08 18:00

## Project Overview

Thread-based note-taking app。ユーザーがスレッド形式でノートを書き、`@ID` でメンション、返信でスレッド化する。バックエンドは Hono + Cloudflare Workers + D1 (SQLite)、フロントエンドは React 18 + TanStack Query。

5つの新機能（Channels, Bookmarks, Tasks, Scratch Pad, Daily Notes）のバックエンドは実装済み。フロントエンドの実装が必要。

## Codebase Structure

```
frontend/src/
├── components/
│   ├── channels/         # ChannelList, ChannelDialog (部分実装済み)
│   ├── bookmarks/        # BookmarkButton (部分実装済み)
│   ├── notes/            # NoteItem, NoteActionMenu, ImagePreview
│   ├── ui/               # Button, TextInput, Dialog, ScrollArea 等
│   ├── layout/           # (SplitView は layouts/ にある)
│   ├── AuthGuard.tsx
│   ├── NoteEditor.tsx
│   ├── NoteList.tsx
│   ├── ThreadView.tsx
│   └── UserButton.tsx
├── hooks/
│   ├── useApiClient.ts   # Fetch wrapper with auth
│   ├── useToggleMap.ts   # Toggle state management
│   └── useUserSync.ts    # Clerk user sync
├── layouts/
│   └── SplitView.tsx     # Responsive split view (drag, keyboard resize)
├── pages/
│   └── NotesPage.tsx     # Main page (SplitView: NoteList | ThreadView)
├── router/
│   └── index.tsx         # 2 routes: /, /notes/:noteId
├── services/
│   ├── note.service.ts   # React Query hooks for notes
│   ├── channel.service.ts # React Query hooks for channels (実装済み)
│   └── bookmark.service.ts # React Query hooks for bookmarks (実装済み)
├── store/
│   ├── notes.store.tsx   # NotesUI context (selectedId, editing, etc.)
│   ├── channel.store.tsx # ChannelUI context (selectedChannelId, dialog)
│   ├── focus.context.tsx # Focus management
│   └── settings.store.tsx # App settings (theme, etc.)
├── lib/
│   └── utils.ts          # cn() utility (tailwind-merge)
└── main.tsx              # Entry point with ClerkProvider / E2E bypass
```

## Important Decisions Made

- **State management**: UI state → React Context, Server state → React Query
- **Routing**: React Router v6 with URL-driven state
- **Styling**: Tailwind CSS + shadcn/ui components
- **Auth bypass**: `VITE_E2E_TEST=true` で Clerk をスキップ（E2Eテスト用）
- **Mobile**: SplitView が 1024px 未満で single-panel モードに切り替わる
- **Mentions**: Regex `/(@\w{6})/g` でパースしてリンク化

## Relevant Files

### Spec Documents

- `memo-app-implementation-plan.md` - 詳細な実装計画（DB schema, API, Frontend構造, Phase分け）
- `memo-app-enhancements-implementation-plan.md` - 機能概要とAPI一覧

### Backend API Routes (全て実装済み)

- `backend/src/api/routes/channels.ts` - CRUD + default
- `backend/src/api/routes/bookmarks.ts` - Toggle + list + check
- `backend/src/api/routes/tasks.ts` - List + toggle
- `backend/src/api/routes/scratch-pad.ts` - Get + update + convert
- `backend/src/api/routes/daily-notes.ts` - Get/create + calendar + templates

### Shared Types (全て定義済み)

- `shared/types/index.ts` - Note, Channel, Bookmark, Task, ScratchPad, DailyNote, Template

### Existing Partial Implementations

- `frontend/src/components/channels/ChannelList.tsx` - 完成しているがUI未統合
- `frontend/src/components/channels/ChannelDialog.tsx` - 完成しているがUI未統合（カラーピッカー内蔵）
- `frontend/src/components/bookmarks/BookmarkButton.tsx` - 完成しているがUI未統合
- `frontend/src/services/channel.service.ts` - 完成
- `frontend/src/services/bookmark.service.ts` - 完成
- `frontend/src/store/channel.store.tsx` - 完成

## Terminology

- **Channel**: ノートを分類するグループ（仕事、趣味など）
- **Scratch Pad**: 一時的なメモ欄。正式ノートに変換可能
- **Daily Note**: 日付ごとの日記。実体はノートへの参照 (daily_notes テーブルが note_id を持つ)
- **Template**: 日記の定型文。プレースホルダー `{{date}}` 等をサポート
- **Thread**: ルートノートとその返信の集合。parent_id で親子関係
- **Mention**: `@noteId` 記法で他のノートを参照
- **SplitView**: 左右パネルのレスポンシブレイアウト
- **TextInput**: 共通テキスト入力コンポーネント（Textarea + ツールバー）
