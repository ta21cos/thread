/**
 * Thread Service with Service Handle Pattern
 *
 * スレッド階層管理サービスの実装。
 */

import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import type { Note, Database } from '../../db';
import { type NoteError, noteNotFoundError } from '../../errors/domain-errors';
import { createNoteRepository } from '../../repositories/note.repository';
import type { ThreadServiceHandle } from './types';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

/**
 * ThreadService Handle を作成
 */
export const createThreadService = ({ db }: { db: Database }): ThreadServiceHandle => {
  const noteRepo = createNoteRepository({ db });

  // ==========================================
  // Internal Implementation Functions
  // ==========================================

  /**
   * ノートのルートを見つける（親を辿る）
   */
  const findRootId = (note: Note): ResultAsync<string, NoteError> => {
    const findParent = (current: Note): ResultAsync<string, NoteError> => {
      if (!current.parentId) {
        return okAsync(current.id);
      }
      return noteRepo
        .findById(current.parentId)
        .andThen((parent) => (parent ? findParent(parent) : okAsync(current.id)));
    };
    return findParent(note);
  };

  // ==========================================
  // Handle (Public API)
  // ==========================================

  return {
    getThread: (noteId) =>
      noteRepo
        .findById(noteId)
        .andThen((note) => (note ? okAsync(note) : errAsync(noteNotFoundError(noteId))))
        .andThen(findRootId)
        .andThen((rootId) => noteRepo.getThreadRecursive(rootId)),

    getChildren: (noteId) => noteRepo.findByParentId(noteId),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

/**
 * テスト用のモック Handle を作成するヘルパー
 */
export const createMockThreadService = (
  overrides: Partial<ThreadServiceHandle> = {}
): ThreadServiceHandle => ({
  getThread: () => okAsync([]),
  getChildren: () => okAsync([]),
  ...overrides,
});
