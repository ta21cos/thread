# Rationale: Stock + Note 機能（Flow×Stock PKM Phase 2）

> Updated at: 2026-03-17 23:55

## Why — なぜこの実装を行うのか

このアプリは「Slack のようなフロー管理」と「Obsidian のようなノート管理」を1つで完結させる個人 PKM ツール。Phase 1 でフロー（チャンネル + 投稿 + スレッド）が完成し、Phase 2 では書き捨ての投稿を知識として蓄積するストック化パイプラインを追加する。

既存ツール（Slack, Notion, Obsidian, Memos）にはいずれも「チャンネルベースのフロー + 明示的な昇格 + インボックス + ノート」を一つで完結するものが存在しない。

## Background — 実装の背景と意思決定

- **プロトタイプからの移植**: `/Users/ta21cos/ghq/github.com/ta21cos/playground/thread-prototype` に SQLite ベースのプロトタイプが存在。本実装は PostgreSQL + Supabase Auth + RLS に適応させた版
- **Flow × Stock の二層設計**: メッセージ（フロー）とストック（ノート）を2系統に分離。inbox と note は同一テーブル `stocks` で `status` カラムにより区別。ノート化は UPDATE 1発で完了
- **昇格はコピー方式**: 元投稿はフローに残したまま、コンテンツを stocks にコピー。source_post_ids は FK ではなく JSON 参照で、元投稿の削除に影響されない
- **グループなしノートはフラット表示**: ユーザー判断により、グループ見出しなしで直接表示。グループ付きノートの後に並べる
- **サイドバーは全ノート折りたたみ**: グループ別アコーディオンで件数表示、展開して全ノートタイトルを表示
- **選択モードはホバーメニュー起点**: ツールバーのチェックボックスで1件選択 → 選択モード突入 → 一括操作バー表示

## Affected Tables

| Table | Operation | Before | After |
|-------|-----------|--------|-------|
| stocks | NEW | — | 新規テーブル（inbox + note 統合、RLS 付き） |
| stock_tags | NEW | — | 新規テーブル（多対多タグ、CASCADE 削除、RLS 付き） |
| posts | WRITE | is_promoted なし | is_promoted (boolean, default false) カラム追加 |

## Out-of-PR Actions

- [ ] `bunx drizzle-kit push` 後に Supabase ダッシュボードで RLS ポリシーが正しく適用されているか確認
- [ ] pg_trgm 拡張が stocks テーブルの検索でも機能することを確認

## Depends On / Blocks

- **PR 1 → PR 2 → PR 3**: 直列依存。各 PR は前の PR がマージされた前提で動作

## Next Steps

- Phase 2.5: タグ管理画面（リネーム・マージ）、インボックス放置通知
- Phase 3: ノート成熟度ステータス、バックリンク `[[記法]]`、AI アシスト、SwiftUI ネイティブアプリ化
