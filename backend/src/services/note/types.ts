/**
 * Note Service Types
 *
 * ノートサービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Note, NoteWithReplyCount } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Input Types
// ==========================================

/** ノート作成のための入力データ */
export interface CreateNoteInput {
  readonly content: string;
  readonly authorId: string;
  readonly parentId?: string;
  readonly isHidden?: boolean;
}

/** ノート更新のための入力データ */
export interface UpdateNoteInput {
  readonly content: string;
}

// ==========================================
// Output Types
// ==========================================

/** ページネーション結果 */
export interface PaginatedNotes {
  readonly notes: NoteWithReplyCount[];
  readonly total: number;
  readonly hasMore: boolean;
}

// ==========================================
// Internal Types
// ==========================================

/** バリデーション済みノートデータ */
export interface ValidatedNoteData {
  readonly id: string;
  readonly content: string;
  readonly authorId: string;
  readonly parentId?: string;
  readonly depth: number;
  readonly mentionIds: string[];
  readonly isHidden: boolean;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

/**
 * NoteService Handle
 *
 * 公開APIを定義するインターフェース。
 * 使用側はこのインターフェースのみを知っていれば良い。
 * テスト時はこのインターフェースをモックする。
 */
export interface NoteServiceHandle {
  /** ノートを作成 */
  readonly createNote: (input: CreateNoteInput) => ResultAsync<Note, NoteError>;
  /** IDでノートを取得（authorId による所有権チェック） */
  readonly getNoteById: (id: string, authorId: string) => ResultAsync<Note, NoteError>;
  /** ルートノートを取得（authorId でフィルタ） */
  readonly getRootNotes: (
    authorId: string,
    limit?: number,
    offset?: number,
    includeHidden?: boolean
  ) => ResultAsync<PaginatedNotes, NoteError>;
  /** ノートを更新（authorId による所有権チェック） */
  readonly updateNote: (
    id: string,
    authorId: string,
    input: UpdateNoteInput
  ) => ResultAsync<Note, NoteError>;
  /** ノートの hidden 状態を更新（authorId による所有権チェック） */
  readonly updateHidden: (
    id: string,
    authorId: string,
    isHidden: boolean
  ) => ResultAsync<Note, NoteError>;
  /** ノートを削除（カスケード、authorId による所有権チェック） */
  readonly deleteNote: (id: string, authorId: string) => ResultAsync<void, NoteError>;
}
