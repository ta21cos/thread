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
 * ノート作成のためのバリデーションパイプライン
 *
 * 処理フロー:
 * 1. コンテンツ長の検証
 * 2. IDの生成
 * 3. メンションIDの抽出
 * 4. 親ノートの取得と深度計算
 * 5. 循環参照の検証
 */
const validateCreateNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (input: CreateNoteInput): ResultAsync<ValidatedNoteData, NoteError> => {
    // Step 1: 同期的なバリデーション
    const contentValidation = validateContentLength(input.content);
    if (contentValidation.isErr()) {
      return errAsync(contentValidation.error);
    }

    const noteId = generateId();
    const mentionIds = extractMentionIds(input.content);

    // Step 2: 親ノートの取得と深度計算
    const parentResult = input.parentId
      ? noteRepo.findById(input.parentId)
      : okAsync<Note | undefined, NoteError>(undefined);

    return parentResult.andThen((parent) => {
      // Step 3: 深度計算
      const depthResult = calculateDepthFromParent(parent, input.parentId);
      if (depthResult.isErr()) {
        return errAsync(depthResult.error);
      }

      // Step 4: 循環参照チェック (メンションがある場合のみ)
      if (mentionIds.length === 0) {
        return okAsync<ValidatedNoteData, NoteError>({
          id: noteId,
          content: input.content,
          parentId: input.parentId,
          depth: depthResult.value,
          mentionIds: [],
        });
      }

      // メンショングラフを取得して循環チェック
      return mentionRepo.getAllMentions().andThen((graph) => {
        const cycleCheck = detectCircularReference(graph, noteId, mentionIds);
        if (cycleCheck.isErr()) {
          return errAsync(cycleCheck.error);
        }

        return okAsync<ValidatedNoteData, NoteError>({
          id: noteId,
          content: input.content,
          parentId: input.parentId,
          depth: depthResult.value,
          mentionIds,
        });
      });
    });
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

    // ノート作成後、メンションを保存
    return noteRepo.create(newNote).andThen((createdNote) => {
      // メンションがない場合はそのまま返す
      if (data.mentionIds.length === 0) {
        return okAsync<Note, NoteError>(createdNote);
      }

      // 全メンションを保存
      const mentionPromises = data.mentionIds.flatMap((mentionId) => {
        const positions = getMentionPositions(data.content, mentionId);
        return positions.map((position) =>
          mentionRepo.create({
            id: generateId(),
            fromNoteId: data.id,
            toNoteId: mentionId,
            position,
            createdAt: new Date(),
          })
        );
      });

      // 全メンションの保存を待つ
      return ResultAsync.combine(mentionPromises).map(() => createdNote);
    });
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
 * IDでノートを取得
 */
const getNoteById =
  (noteRepo: NoteRepository) =>
  (id: string): ResultAsync<Note, NoteError> => {
    return noteRepo.findById(id).andThen((note) => {
      if (!note) {
        return errAsync<Note, NoteError>(noteNotFoundError(id));
      }
      return okAsync<Note, NoteError>(note);
    });
  };

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
 */
const updateNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (id: string, input: UpdateNoteInput): ResultAsync<Note, NoteError> => {
    // Step 1: コンテンツのバリデーション
    const contentValidation = validateContentLength(input.content);
    if (contentValidation.isErr()) {
      return errAsync(contentValidation.error);
    }

    // Step 2: 既存ノートの確認
    return noteRepo.findById(id).andThen((existing) => {
      if (!existing) {
        return errAsync<Note, NoteError>(noteNotFoundError(id));
      }

      const mentionIds = extractMentionIds(input.content);

      // Step 3: 循環参照チェック
      const checkCycle = (): ResultAsync<void, NoteError> => {
        if (mentionIds.length === 0) {
          return okAsync(undefined);
        }
        return mentionRepo.getAllMentions().andThen((graph) => {
          const cycleCheck = detectCircularReference(graph, id, mentionIds);
          if (cycleCheck.isErr()) {
            return errAsync(cycleCheck.error);
          }
          return okAsync(undefined);
        });
      };

      return checkCycle()
        .andThen(() => mentionRepo.deleteByNoteId(id)) // Step 4: 古いメンションを削除
        .andThen(() => noteRepo.update(id, input.content)) // Step 5: ノート更新
        .andThen((updated) => {
          // Step 6: 新しいメンションを作成
          if (mentionIds.length === 0) {
            return okAsync<Note, NoteError>(updated);
          }

          const mentionPromises = mentionIds.flatMap((mentionId) => {
            const positions = getMentionPositions(input.content, mentionId);
            return positions.map((position) =>
              mentionRepo.create({
                id: generateId(),
                fromNoteId: id,
                toNoteId: mentionId,
                position,
                createdAt: new Date(),
              })
            );
          });

          return ResultAsync.combine(mentionPromises).map(() => updated);
        });
    });
  };

/**
 * ノートを削除 (カスケード削除)
 *
 * DeleteService を参考にした実装:
 * 1. ノートが存在するか確認
 * 2. 子ノートを取得 (2レベル制約により1レベルのみ)
 * 3. 親と子のメンションを削除
 * 4. 子ノートを削除
 * 5. 親ノートを削除
 */
const deleteNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (id: string): ResultAsync<void, NoteError> => {
    // Step 1: ノートが存在するか確認
    return noteRepo.findById(id).andThen((note) => {
      if (!note) {
        return errAsync<void, NoteError>(noteNotFoundError(id));
      }

      // Step 2: 子ノートを取得 (2レベル制約により1レベルのみ)
      return noteRepo.findByParentId(id).andThen((children) => {
        // Step 3: 親と子のメンションを削除
        const deleteParentMentions = mentionRepo.deleteByNoteId(id);
        const deleteChildrenMentions = ResultAsync.combine(
          children.map((child) => mentionRepo.deleteByNoteId(child.id))
        );

        return deleteParentMentions
          .andThen(() => deleteChildrenMentions)
          .andThen(() => {
            // Step 4: 子ノートを削除
            const deleteChildren = ResultAsync.combine(
              children.map((child) => noteRepo.delete(child.id))
            );

            return deleteChildren.andThen(() => {
              // Step 5: 親ノートを削除
              return noteRepo.delete(id);
            });
          });
      });
    });
  };

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
