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

import { ok, err, ResultAsync, Result, okAsync, errAsync } from 'neverthrow';
import { type Note, type NewNote, type NoteWithReplyCount, type Database } from '../../db';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import { generateId } from '../../utils/id-generator';
import { extractMentions, getMentionPositions } from '../../utils/mention-parser';
import {
  type NoteError,
  contentTooLongError,
  contentEmptyError,
  parentNoteNotFoundError,
  depthLimitExceededError,
  circularReferenceError,
  noteNotFoundError,
} from '../../errors/domain-errors';
import { createNoteRepository } from '../../repositories/note.repository';
import { createMentionRepository } from '../../repositories/mention.repository';

// ==========================================
// Handle Interface (Public API)
// ==========================================

/** ノート作成のための入力データ */
export interface CreateNoteInput {
  readonly content: string;
  readonly parentId?: string;
}

/** ノート更新のための入力データ */
export interface UpdateNoteInput {
  readonly content: string;
}

/** ページネーション結果 */
export interface PaginatedNotes {
  readonly notes: NoteWithReplyCount[];
  readonly total: number;
  readonly hasMore: boolean;
}

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
  /** IDでノートを取得 */
  readonly getNoteById: (id: string) => ResultAsync<Note, NoteError>;
  /** ルートノートを取得 */
  readonly getRootNotes: (
    limit?: number,
    offset?: number
  ) => ResultAsync<PaginatedNotes, NoteError>;
  /** ノートを更新 */
  readonly updateNote: (id: string, input: UpdateNoteInput) => ResultAsync<Note, NoteError>;
  /** ノートを削除（カスケード） */
  readonly deleteNote: (id: string) => ResultAsync<void, NoteError>;
}

// ==========================================
// Internal Helpers (Hidden from outside)
// ==========================================

/** Result を ResultAsync に変換 */
const fromResult = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.isOk() ? okAsync(result.value) : errAsync(result.error);

/** バリデーション済みノートデータ */
interface ValidatedNoteData {
  readonly id: string;
  readonly content: string;
  readonly parentId?: string;
  readonly depth: number;
  readonly mentionIds: string[];
}

// ==========================================
// Pure Validation Functions
// ==========================================

/**
 * コンテンツの長さを検証
 */
export const validateContentLength = (content: string): Result<string, NoteError> => {
  if (content.length === 0) {
    return err(contentEmptyError());
  }
  if (content.length > MAX_NOTE_LENGTH) {
    return err(contentTooLongError(MAX_NOTE_LENGTH, content.length));
  }
  return ok(content);
};

/**
 * メンションIDを抽出
 */
export const extractMentionIds = (content: string): string[] => extractMentions(content);

// ==========================================
// Repository Re-exports
// ==========================================

export { createNoteRepository } from '../../repositories/note.repository';
export { createMentionRepository } from '../../repositories/mention.repository';

// ==========================================
// Pure Business Logic
// ==========================================

/**
 * 循環参照を検出 (DFS)
 */
export const detectCircularReference = (
  graph: Map<string, string[]>,
  fromNoteId: string,
  toNoteIds: string[]
): Result<void, NoteError> => {
  const tempGraph = new Map(graph);
  const existingMentions = tempGraph.get(fromNoteId) || [];
  tempGraph.set(fromNoteId, [...existingMentions, ...toNoteIds]);

  const visited = new Set<string>();
  const stack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = tempGraph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    stack.delete(nodeId);
    return false;
  };

  return hasCycle(fromNoteId) ? err(circularReferenceError(fromNoteId, toNoteIds)) : ok(undefined);
};

/**
 * 親ノートから深度を計算
 */
const calculateDepthFromParent = (
  parent: Note | undefined,
  parentId?: string
): Result<number, NoteError> => {
  if (!parentId) return ok(0);
  if (!parent) return err(parentNoteNotFoundError(parentId));
  if (parent.depth >= 1) return err(depthLimitExceededError(1));
  return ok(1);
};

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
