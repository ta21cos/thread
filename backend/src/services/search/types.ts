/**
 * Search Service Types
 *
 * 検索サービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Handle Interface (Public API)
// ==========================================

/**
 * SearchService Handle
 *
 * 検索機能のための公開API。
 */
export interface SearchServiceHandle {
  /** コンテンツでノートを検索（authorId でフィルタ） */
  readonly searchByContent: (
    authorId: string,
    query: string,
    limit?: number
  ) => ResultAsync<Note[], NoteError>;
  /** メンションでノートを検索（指定ノートをメンションしているノート一覧、authorId でフィルタ） */
  readonly searchByMention: (noteId: string, authorId: string) => ResultAsync<Note[], NoteError>;
}
