/**
 * Thread Service Types
 *
 * スレッドサービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Note } from '../../../api/db';
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
  /** ノートが属するスレッド全体を取得（ルートから全子孫） */
  readonly getThread: (noteId: string) => ResultAsync<Note[], NoteError>;
  /** ノートの直接の子ノートを取得 */
  readonly getChildren: (noteId: string) => ResultAsync<Note[], NoteError>;
}
