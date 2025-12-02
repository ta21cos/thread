/**
 * Functional Note Service with neverthrow
 *
 * 関数型アプローチによるノートサービスの実装例。
 *
 * ## 設計原則
 * 1. 純粋関数: 副作用は ResultAsync で明示的に扱う
 * 2. 型安全なエラー: 全エラーケースが型で表現される
 * 3. 関数合成: andThen によるパイプライン処理
 * 4. 依存性注入: リポジトリを関数パラメータとして渡す
 * 5. テスタビリティ: モック可能なインターフェース
 */

import { ok, err, ResultAsync, Result, okAsync, errAsync } from 'neverthrow';
import { eq, isNull, desc } from 'drizzle-orm';
import { db, notes, mentions, type Note, type NewNote, type NewMention } from '../db';
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
  databaseError,
} from '../errors/domain-errors';

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

/** リポジトリインターフェース (依存性注入用) */
export interface NoteRepository {
  findById: (id: string) => ResultAsync<Note | undefined, NoteError>;
  create: (note: NewNote) => ResultAsync<Note, NoteError>;
  update: (id: string, content: string) => ResultAsync<Note, NoteError>;
  findRootNotes: (limit: number, offset: number) => ResultAsync<Note[], NoteError>;
  countRootNotes: () => ResultAsync<number, NoteError>;
}

export interface MentionRepository {
  create: (mention: NewMention) => ResultAsync<void, NoteError>;
  deleteByNoteId: (noteId: string) => ResultAsync<void, NoteError>;
  getAllMentions: () => ResultAsync<Map<string, string[]>, NoteError>;
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

/**
 * デフォルトのノートリポジトリ実装
 * データベース操作を ResultAsync でラップ
 */
export const createNoteRepository = (): NoteRepository => ({
  findById: (id: string): ResultAsync<Note | undefined, NoteError> =>
    ResultAsync.fromPromise(
      db.select().from(notes).where(eq(notes.id, id)).then(([note]) => note),
      (error) => databaseError('Failed to find note', error)
    ),

  create: (note: NewNote): ResultAsync<Note, NoteError> =>
    ResultAsync.fromPromise(
      db.insert(notes).values(note).returning().then(([created]) => created),
      (error) => databaseError('Failed to create note', error)
    ),

  update: (id: string, content: string): ResultAsync<Note, NoteError> =>
    ResultAsync.fromPromise(
      db
        .update(notes)
        .set({ content, updatedAt: new Date() })
        .where(eq(notes.id, id))
        .returning()
        .then(([updated]) => updated),
      (error) => databaseError('Failed to update note', error)
    ),

  findRootNotes: (limit: number, offset: number): ResultAsync<Note[], NoteError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(notes)
        .where(isNull(notes.parentId))
        .orderBy(desc(notes.createdAt))
        .limit(limit)
        .offset(offset),
      (error) => databaseError('Failed to find root notes', error)
    ),

  countRootNotes: (): ResultAsync<number, NoteError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(notes)
        .where(isNull(notes.parentId))
        .then((result) => result.length),
      (error) => databaseError('Failed to count root notes', error)
    ),
});

/**
 * デフォルトのメンションリポジトリ実装
 */
export const createMentionRepository = (): MentionRepository => ({
  create: (mention: NewMention): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db.insert(mentions).values(mention).then(() => undefined),
      (error) => databaseError('Failed to create mention', error)
    ),

  deleteByNoteId: (noteId: string): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db.delete(mentions).where(eq(mentions.fromNoteId, noteId)).then(() => undefined),
      (error) => databaseError('Failed to delete mentions', error)
    ),

  getAllMentions: (): ResultAsync<Map<string, string[]>, NoteError> =>
    ResultAsync.fromPromise(
      db.select().from(mentions).then((allMentions) => {
        const graph = new Map<string, string[]>();
        for (const mention of allMentions) {
          if (!graph.has(mention.fromNoteId)) {
            graph.set(mention.fromNoteId, []);
          }
          graph.get(mention.fromNoteId)!.push(mention.toNoteId);
        }
        return graph;
      }),
      (error) => databaseError('Failed to get mentions', error)
    ),
});

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
const calculateDepthFromParent = (parent: Note | undefined, parentId?: string): Result<number, NoteError> => {
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
export const validateCreateNote =
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
export const persistNote =
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
export const createNote =
  (noteRepo: NoteRepository, mentionRepo: MentionRepository) =>
  (input: CreateNoteInput): ResultAsync<Note, NoteError> => {
    return validateCreateNote(noteRepo, mentionRepo)(input).andThen(persistNote(noteRepo, mentionRepo));
  };

/**
 * IDでノートを取得
 */
export const getNoteById =
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
export const getRootNotes =
  (noteRepo: NoteRepository) =>
  (
    limit: number = 20,
    offset: number = 0
  ): ResultAsync<{ notes: Note[]; total: number; hasMore: boolean }, NoteError> => {
    return ResultAsync.combine([noteRepo.findRootNotes(limit, offset), noteRepo.countRootNotes()]).map(
      ([foundNotes, total]) => ({
        notes: foundNotes,
        total,
        hasMore: offset + foundNotes.length < total,
      })
    );
  };

/**
 * ノートを更新
 */
export const updateNote =
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

// ==========================================
// Default Instance (Convenience Export)
// ==========================================

const defaultNoteRepo = createNoteRepository();
const defaultMentionRepo = createMentionRepository();

/** デフォルトリポジトリを使用したサービス関数群 */
export const functionalNoteService = {
  createNote: createNote(defaultNoteRepo, defaultMentionRepo),
  getNoteById: getNoteById(defaultNoteRepo),
  getRootNotes: getRootNotes(defaultNoteRepo),
  updateNote: updateNote(defaultNoteRepo, defaultMentionRepo),
};
