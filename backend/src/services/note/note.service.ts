/**
 * Note Service with Service Handle Pattern
 *
 * Service Handle パターンによるノートサービスの実装。
 *
 * ## 設計原則
 * 1. Handle = 公開インターフェース: 操作をレコードとしてまとめる
 * 2. 内部実装の隠蔽: リポジトリや内部関数は外部から見えない
 * 3. テスタビリティ: Handle をモックとして差し替え可能
 * 4. 型安全なエラー: ResultAsync + NoteError による明示的エラー
 * 5. 関数合成: andThen によるパイプライン処理
 */

import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import { type Note, type NewNote, type Database } from '../../db';
import { type NoteError, noteNotFoundError } from '../../errors/domain-errors';
import { createNoteRepository } from '../../repositories/note.repository';
import { createMentionRepository } from '../../repositories/mention.repository';
import { generateId } from '../../utils/id-generator';
import { getMentionPositions } from '../../utils/mention-parser';

import type { CreateNoteInput, NoteServiceHandle, ValidatedNoteData } from './types';
import {
  fromResult,
  validateContentLength,
  extractMentionIds,
  detectCircularReference,
  calculateDepthFromParent,
} from './validation';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

/**
 * NoteService Handle を作成
 *
 * Service Handle パターン:
 * - 内部実装（リポジトリ、ヘルパー関数）は完全に隠蔽
 * - 公開 API は NoteServiceHandle インターフェースで定義
 * - テスト時は Handle 全体をモック可能
 */
export const createNoteService = ({ db }: { db: Database }): NoteServiceHandle => {
  // 内部依存性（外部からはアクセス不可）
  const noteRepo = createNoteRepository({ db });
  const mentionRepo = createMentionRepository({ db });

  // ==========================================
  // Internal Implementation Functions
  // ==========================================

  const validateCircularReference = (
    noteId: string,
    mentionIds: string[]
  ): ResultAsync<void, NoteError> =>
    mentionRepo
      .getAllMentions()
      .andThen((graph) => fromResult(detectCircularReference(graph, noteId, mentionIds)));

  const validateCreateNote = (
    input: CreateNoteInput
  ): ResultAsync<ValidatedNoteData, NoteError> => {
    const noteId = generateId();
    const mentionIds = extractMentionIds(input.content);

    return fromResult(validateContentLength(input.content))
      .andThen(() => (input.parentId ? noteRepo.findById(input.parentId) : okAsync(undefined)))
      .andThen((parent) => fromResult(calculateDepthFromParent(parent, input.parentId)))
      .andThen((depth) =>
        mentionIds.length === 0
          ? okAsync({
              id: noteId,
              content: input.content,
              parentId: input.parentId,
              depth,
              mentionIds: [],
            })
          : validateCircularReference(noteId, mentionIds).map(() => ({
              id: noteId,
              content: input.content,
              parentId: input.parentId,
              depth,
              mentionIds,
            }))
      );
  };

  const createMentionsForNote = (
    noteId: string,
    content: string,
    mentionIds: string[]
  ): ResultAsync<void, NoteError> => {
    if (mentionIds.length === 0) {
      return okAsync(undefined);
    }

    const mentionPromises = mentionIds.flatMap((mentionId) => {
      const positions = getMentionPositions(content, mentionId);
      return positions.map((position) =>
        mentionRepo.create({
          id: generateId(),
          fromNoteId: noteId,
          toNoteId: mentionId,
          position,
          createdAt: new Date(),
        })
      );
    });

    return ResultAsync.combine(mentionPromises).map(() => undefined);
  };

  const persistNote = (data: ValidatedNoteData): ResultAsync<Note, NoteError> => {
    const newNote: NewNote = {
      id: data.id,
      content: data.content,
      parentId: data.parentId,
      depth: data.depth,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return noteRepo
      .create(newNote)
      .andThen((createdNote) =>
        createMentionsForNote(data.id, data.content, data.mentionIds).map(() => createdNote)
      );
  };

  const ensureNoteExists =
    (id: string) =>
    (note: Note | undefined): ResultAsync<Note, NoteError> =>
      note ? okAsync(note) : errAsync(noteNotFoundError(id));

  const deleteMentionsFor = (noteIds: string[]): ResultAsync<void, NoteError> =>
    noteIds.length === 0
      ? okAsync(undefined)
      : ResultAsync.combine(noteIds.map((nid) => mentionRepo.deleteByNoteId(nid))).map(
          () => undefined
        );

  const deleteNotes = (noteIds: string[]): ResultAsync<void, NoteError> =>
    noteIds.length === 0
      ? okAsync(undefined)
      : ResultAsync.combine(noteIds.map((nid) => noteRepo.delete(nid))).map(() => undefined);

  // ==========================================
  // Handle (Public API)
  // ==========================================

  return {
    createNote: (input) => validateCreateNote(input).andThen(persistNote),

    getNoteById: (id) => noteRepo.findById(id).andThen(ensureNoteExists(id)),

    getRootNotes: (limit = 20, offset = 0) =>
      ResultAsync.combine([noteRepo.findRootNotes(limit, offset), noteRepo.countRootNotes()]).map(
        ([notes, total]) => ({
          notes,
          total,
          hasMore: offset + notes.length < total,
        })
      ),

    updateNote: (id, input) => {
      const mentionIds = extractMentionIds(input.content);
      const checkCycle =
        mentionIds.length === 0 ? okAsync(undefined) : validateCircularReference(id, mentionIds);

      return fromResult(validateContentLength(input.content))
        .andThen(() => noteRepo.findById(id))
        .andThen(ensureNoteExists(id))
        .andThen(() => checkCycle)
        .andThen(() => mentionRepo.deleteByNoteId(id))
        .andThen(() => noteRepo.update(id, input.content))
        .andThen((updated) =>
          createMentionsForNote(id, input.content, mentionIds).map(() => updated)
        );
    },

    deleteNote: (id) =>
      noteRepo
        .findById(id)
        .andThen(ensureNoteExists(id))
        .andThen(() => noteRepo.findByParentId(id))
        .andThen((children) => {
          const allNoteIds = [id, ...children.map((child) => child.id)];
          const childIds = children.map((child) => child.id);

          return deleteMentionsFor(allNoteIds)
            .andThen(() => deleteNotes(childIds))
            .andThen(() => noteRepo.delete(id));
        }),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

/**
 * テスト用のモック Handle を作成するヘルパー
 *
 * 使用例:
 * ```ts
 * const mockHandle = createMockNoteService({
 *   createNote: vi.fn().mockReturnValue(okAsync(mockNote)),
 * });
 * ```
 */
export const createMockNoteService = (
  overrides: Partial<NoteServiceHandle> = {}
): NoteServiceHandle => ({
  createNote: () => errAsync(noteNotFoundError('mock')),
  getNoteById: () => errAsync(noteNotFoundError('mock')),
  getRootNotes: () => okAsync({ notes: [], total: 0, hasMore: false }),
  updateNote: () => errAsync(noteNotFoundError('mock')),
  deleteNote: () => okAsync(undefined),
  ...overrides,
});
