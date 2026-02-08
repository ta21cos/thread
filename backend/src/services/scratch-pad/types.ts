/**
 * Scratch Pad Service Types
 */

import type { ResultAsync } from 'neverthrow';
import type { ScratchPad, Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Handle Interface (Public API)
// ==========================================

export interface ScratchPadServiceHandle {
  /** スクラッチパッドを取得（なければ作成） */
  readonly getScratchPad: (
    authorId: string,
    channelId?: string | null
  ) => ResultAsync<ScratchPad, NoteError>;
  /** スクラッチパッドを更新 */
  readonly updateScratchPad: (
    authorId: string,
    content: string,
    channelId?: string | null
  ) => ResultAsync<ScratchPad, NoteError>;
  /** スクラッチパッドをノートに変換 */
  readonly convertToNote: (
    authorId: string,
    channelId?: string | null
  ) => ResultAsync<Note, NoteError>;
}
