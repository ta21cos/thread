/**
 * Functional Note Service with neverthrow
 *
 * 関数型アプローチによるノートサービスの実装。
 *
 * ## 設計原則
 * 1. 純粋関数: 副作用は ResultAsync で明示的に扱う
 * 2. 型安全なエラー: 全エラーケースが型で表現される
 * 3. 関数合成: andThen によるパイプライン処理
 * 4. 依存性注入: リポジトリを関数パラメータとして渡す
 * 5. テスタビリティ: モック可能なインターフェース
 */

import { ok, err, ResultAsync, Result, okAsync, errAsync } from 'neverthrow';
import { type Note, type NewNote, type NoteWithReplyCount, type Database } from '../db';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import { generateId } from '../utils/id-generator';
import { extractMentions, getMentionPositions } from '../utils/mention-parser';
import {
  type NoteError,
  contentTooLongError,
  contentEmptyError,
  parentNoteNotFoundError,
  depthLimitExceededError,
  circularReferenceError,
  noteNotFoundError,
} from '../errors/domain-errors';
import { type NoteRepository, createNoteRepository } from '../repositories/note.repository';
import {
  type MentionRepository,
  createMentionRepository,
} from '../repositories/mention.repository';

// ==========================================
// Helpers
// ==========================================

// NOTE: neverthrow には fromResult() がないため自前で定義
const fromResult = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.isOk() ? okAsync(result.value) : errAsync(result.error);

// ==========================================
// Types
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
 * 純粋関数 - 副作用なし
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
 * 純粋関数 - 副作用なし
 */
export const extractMentionIds = (content: string): string[] => {
  return extractMentions(content);
};

// ==========================================
// Repository Implementation (Default)
// ==========================================
// リポジトリ実装は note.repository.ts と mention.repository.ts に移動
// 再エクスポート
export { createNoteRepository } from '../repositories/note.repository';
export { createMentionRepository } from '../repositories/mention.repository';

// ==========================================
// Business Logic (Pure Functions)
// ==========================================

/**
 * 循環参照を検出 (DFS)
 * 純粋関数 - グラフのみを操作
 */
export const detectCircularReference = (
  graph: Map<string, string[]>,
  fromNoteId: string,
  toNoteIds: string[]
): Result<void, NoteError> => {
  // グラフに提案されたメンションを追加
  const tempGraph = new Map(graph);
  const existingMentions = tempGraph.get(fromNoteId) || [];
  tempGraph.set(fromNoteId, [...existingMentions, ...toNoteIds]);

  // DFSで循環検出
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

  if (hasCycle(fromNoteId)) {
    return err(circularReferenceError(fromNoteId, toNoteIds));
  }

  return ok(undefined);
};

/**
 * 親ノートから深度を計算し、制約をチェック
 */
const calculateDepthFromParent = (
  parent: Note | undefined,
  parentId?: string
): Result<number, NoteError> => {
  if (!parentId) {
    return ok(0); // ルートノート
  }

  if (!parent) {
    return err(parentNoteNotFoundError(parentId));
  }

  // 2レベル制約: depth >= 1 のノートには子を作成できない
  if (parent.depth >= 1) {
    return err(depthLimitExceededError(1));
  }

  return ok(1); // 子ノードは常にdepth 1
};

// ==========================================
// Service Functions (Composed Operations)
// ==========================================

/**
 * 循環参照をチェック（ResultAsync版）
 * メンショングラフを取得し、循環参照がないか検証する
 */
const validateCircularReference =
  (mentionRepo: MentionRepository) =>
  (noteId: string, mentionIds: string[]): ResultAsync<void, NoteError> =>
    mentionRepo
      .getAllMentions()
      .andThen((graph) => fromResult(detectCircularReference(graph, noteId, mentionIds)));

/**
 * ノート作成のためのバリデーションパイプライン
 *
 * 処理フロー:
 * 1. コンテンツ長の検証
 * 2. 親ノートの取得と深度計算
 * 3. 循環参照の検証（メンションがある場合のみ）
 *
 * 完全なパイプライン - isErr() チェックなし
 */
const validateCreateNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (input: CreateNoteInput): ResultAsync<ValidatedNoteData, NoteError> => {
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
          : validateCircularReference(mentionRepo)(noteId, mentionIds).map(() => ({
              id: noteId,
              content: input.content,
              parentId: input.parentId,
              depth,
              mentionIds,
            }))
      );
  };

/**
 * メンションを作成するヘルパー
 */
const createMentions =
  (mentionRepo: MentionRepository) =>
  (noteId: string, content: string, mentionIds: string[]): ResultAsync<void, NoteError> => {
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

/**
 * ノートを作成
 *
 * バリデーション済みデータからノートとメンションを作成
 */
const persistNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (data: ValidatedNoteData): ResultAsync<Note, NoteError> => {
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
        createMentions(mentionRepo)(data.id, data.content, data.mentionIds).map(() => createdNote)
      );
  };

/**
 * ノートを作成 (メインエントリーポイント)
 *
 * バリデーションと永続化を合成したパイプライン
 */
const createNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (input: CreateNoteInput): ResultAsync<Note, NoteError> => {
    return validateCreateNote(
      noteRepo,
      mentionRepo
    )(input).andThen(persistNote(noteRepo, mentionRepo));
  };

/**
 * ノート存在確認ヘルパー
 */
const ensureNoteExists =
  (id: string) =>
  (note: Note | undefined): ResultAsync<Note, NoteError> =>
    note ? okAsync(note) : errAsync(noteNotFoundError(id));

/**
 * IDでノートを取得
 */
const getNoteById =
  (noteRepo: NoteRepository) =>
  (id: string): ResultAsync<Note, NoteError> =>
    noteRepo.findById(id).andThen(ensureNoteExists(id));

/**
 * ルートノートのリストを取得
 */
const getRootNotes =
  (noteRepo: NoteRepository) =>
  (
    limit: number = 20,
    offset: number = 0
  ): ResultAsync<{ notes: NoteWithReplyCount[]; total: number; hasMore: boolean }, NoteError> => {
    return ResultAsync.combine([
      noteRepo.findRootNotes(limit, offset),
      noteRepo.countRootNotes(),
    ]).map(([foundNotes, total]) => ({
      notes: foundNotes,
      total,
      hasMore: offset + foundNotes.length < total,
    }));
  };

/**
 * ノートを更新
 *
 * 完全なパイプライン - isErr() チェックなし
 */
const updateNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (id: string, input: UpdateNoteInput): ResultAsync<Note, NoteError> => {
    const mentionIds = extractMentionIds(input.content);

    // 循環参照チェック（メンションがある場合のみ）
    const checkCycle =
      mentionIds.length === 0
        ? okAsync(undefined)
        : validateCircularReference(mentionRepo)(id, mentionIds);

    return fromResult(validateContentLength(input.content))
      .andThen(() => noteRepo.findById(id))
      .andThen(ensureNoteExists(id))
      .andThen(() => checkCycle)
      .andThen(() => mentionRepo.deleteByNoteId(id))
      .andThen(() => noteRepo.update(id, input.content))
      .andThen((updated) =>
        createMentions(mentionRepo)(id, input.content, mentionIds).map(() => updated)
      );
  };

/**
 * 複数ノートのメンションを一括削除
 */
const deleteMentionsFor =
  (mentionRepo: MentionRepository) =>
  (noteIds: string[]): ResultAsync<void, NoteError> =>
    noteIds.length === 0
      ? okAsync(undefined)
      : ResultAsync.combine(noteIds.map((nid) => mentionRepo.deleteByNoteId(nid))).map(
          () => undefined
        );

/**
 * 複数ノートを一括削除
 */
const deleteNotes =
  (noteRepo: NoteRepository) =>
  (noteIds: string[]): ResultAsync<void, NoteError> =>
    noteIds.length === 0
      ? okAsync(undefined)
      : ResultAsync.combine(noteIds.map((nid) => noteRepo.delete(nid))).map(() => undefined);

/**
 * ノートを削除 (カスケード削除)
 *
 * 処理フロー:
 * 1. ノートが存在するか確認
 * 2. 子ノートを取得 (2レベル制約により1レベルのみ)
 * 3. 親と子のメンションを削除
 * 4. 子ノートを削除
 * 5. 親ノートを削除
 *
 * フラットなパイプライン - ネスト最小化
 */
const deleteNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (id: string): ResultAsync<void, NoteError> =>
    noteRepo
      .findById(id)
      .andThen(ensureNoteExists(id))
      .andThen(() => noteRepo.findByParentId(id))
      .andThen((children) => {
        const allNoteIds = [id, ...children.map((child) => child.id)];
        const childIds = children.map((child) => child.id);

        return deleteMentionsFor(mentionRepo)(allNoteIds)
          .andThen(() => deleteNotes(noteRepo)(childIds))
          .andThen(() => noteRepo.delete(id));
      });

// ==========================================
// Default Instance (Convenience Export)
// ==========================================

/**
 * サービス関数群を作成
 * @note.service.ts と同様に db を引数として受け取る
 */
export const createNoteService = ({ db }: { db: Database }) => {
  const noteRepo = createNoteRepository({ db });
  const mentionRepo = createMentionRepository({ db });

  return {
    createNote: createNote(noteRepo, mentionRepo),
    getNoteById: getNoteById(noteRepo),
    getRootNotes: getRootNotes(noteRepo),
    updateNote: updateNote(noteRepo, mentionRepo),
    deleteNote: deleteNote(noteRepo, mentionRepo),
  };
};
