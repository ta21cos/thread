/**
 * Thread Service Types
 *
 * スレッドサービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Handle Interface (Public API)
// ==========================================

/**
 * ThreadService Handle
 *
 * スレッド階層管理のための公開API。
 */
export interface ThreadServiceHandle {
  /** ノートが属するスレッド全体を取得（ルートから全子孫、authorId でフィルタ） */
  readonly getThread: (noteId: string, authorId: string) => ResultAsync<Note[], NoteError>;
  /** ノートの直接の子ノートを取得（authorId でフィルタ） */
  readonly getChildren: (noteId: string, authorId: string) => ResultAsync<Note[], NoteError>;
}
