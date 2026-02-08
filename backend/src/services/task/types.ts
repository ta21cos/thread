/**
 * Task Service Types
 */

import type { ResultAsync } from 'neverthrow';
import type { Task, Note } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Output Types
// ==========================================

export interface TaskWithNote extends Task {
  note: Note;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

export interface TaskServiceHandle {
  /** ノートからタスクを同期 */
  readonly syncTasksFromNote: (
    noteId: string,
    authorId: string,
    content: string
  ) => ResultAsync<Task[], NoteError>;
  /** タスクの完了状態を切り替え */
  readonly toggleTask: (taskId: string) => ResultAsync<Task, NoteError>;
  /** ユーザーのタスク一覧を取得 */
  readonly getTasks: (
    authorId: string,
    includeCompleted?: boolean,
    limit?: number
  ) => ResultAsync<Task[], NoteError>;
  /** ノートのタスク一覧を取得 */
  readonly getTasksByNote: (noteId: string) => ResultAsync<Task[], NoteError>;
}
