/**
 * Mention Service Types
 *
 * メンションサービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Mention, Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Output Types
// ==========================================

/** メンションとノートの組み合わせ */
export interface MentionWithNote {
  readonly mentions: Mention;
  readonly notes: Note;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

/**
 * MentionService Handle
 *
 * メンション管理のための公開API。
 */
export interface MentionServiceHandle {
  /** 指定ノートへのメンション一覧を取得（authorId でフィルタ） */
  readonly getMentions: (toNoteId: string, authorId: string) => ResultAsync<Mention[], NoteError>;
  /** 指定ノートへのメンションとソースノート情報を取得（authorId でフィルタ） */
  readonly getMentionsWithNotes: (
    toNoteId: string,
    authorId: string
  ) => ResultAsync<MentionWithNote[], NoteError>;
  /** メンションの循環参照を検証 */
  readonly validateMentions: (
    fromNoteId: string,
    toNoteIds: string[]
  ) => ResultAsync<void, NoteError>;
}
