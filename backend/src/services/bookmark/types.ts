/**
 * Bookmark Service Types
 */

import type { ResultAsync } from 'neverthrow';
import type { Bookmark, Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Output Types
// ==========================================

export interface BookmarkWithNote extends Bookmark {
  note: Note;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

export interface BookmarkServiceHandle {
  /** ブックマークを切り替え（追加/削除） */
  readonly toggleBookmark: (
    noteId: string,
    authorId: string
  ) => ResultAsync<{ bookmarked: boolean }, NoteError>;
  /** ノートがブックマークされているか確認 */
  readonly isBookmarked: (noteId: string, authorId: string) => ResultAsync<boolean, NoteError>;
  /** ユーザーのブックマーク一覧を取得 */
  readonly getBookmarks: (authorId: string, limit?: number) => ResultAsync<Bookmark[], NoteError>;
  /** ブックマークを削除 */
  readonly removeBookmark: (noteId: string, authorId: string) => ResultAsync<void, NoteError>;
}
