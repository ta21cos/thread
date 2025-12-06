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
import { eq, isNull, desc } from 'drizzle-orm';
import { notes, mentions, type Note, type NewNote, type NewMention, type Database } from '../db';
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
import { NoteRepository } from '../repositories/note.repository';
import { MentionRepository } from '../repositories/mention.repository';
import { MentionService } from './mention.service';

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
export interface FunctionalNoteRepository {
  findById: (id: string) => ResultAsync<Note | undefined, NoteError>;
  create: (note: NewNote) => ResultAsync<Note, NoteError>;
  update: (id: string, content: string) => ResultAsync<Note, NoteError>;
  findRootNotes: (limit: number, offset: number) => ResultAsync<Note[], NoteError>;
  countRootNotes: () => ResultAsync<number, NoteError>;
  findByParentId: (parentId: string) => ResultAsync<Note[], NoteError>;
  delete: (id: string) => ResultAsync<void, NoteError>;
}

export interface FunctionalMentionRepository {
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
export const createFunctionalNoteRepository = ({ db }: { db: Database }): FunctionalNoteRepository => ({
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

  findByParentId: (parentId: string): ResultAsync<Note[], NoteError> =>
    ResultAsync.fromPromise(
      db.select().from(notes).where(eq(notes.parentId, parentId)),
      (error) => databaseError('Failed to find notes by parent id', error)
    ),

  delete: (id: string): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db.delete(notes).where(eq(notes.id, id)).then(() => undefined),
      (error) => databaseError('Failed to delete note', error)
    ),
});

/**
 * デフォルトのメンションリポジトリ実装
 */
export const createFunctionalMentionRepository = ({ db }: { db: Database }): FunctionalMentionRepository => ({
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
  (noteRepo: FunctionalNoteRepository, mentionRepo: FunctionalMentionRepository) =>
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
  (noteRepo: FunctionalNoteRepository, mentionRepo: FunctionalMentionRepository) =>
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
  (noteRepo: FunctionalNoteRepository, mentionRepo: FunctionalMentionRepository) =>
  (input: CreateNoteInput): ResultAsync<Note, NoteError> => {
    return validateCreateNote(noteRepo, mentionRepo)(input).andThen(persistNote(noteRepo, mentionRepo));
  };

/**
 * IDでノートを取得
 */
export const getNoteById =
  (noteRepo: FunctionalNoteRepository) =>
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
  (noteRepo: FunctionalNoteRepository) =>
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
  (noteRepo: FunctionalNoteRepository, mentionRepo: FunctionalMentionRepository) =>
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
export const deleteNote =
  (noteRepo: FunctionalNoteRepository, mentionRepo: FunctionalMentionRepository) =>
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
            const deleteChildren = ResultAsync.combine(children.map((child) => noteRepo.delete(child.id)));

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
  const noteRepo = createFunctionalNoteRepository({ db });
  const mentionRepo = createFunctionalMentionRepository({ db });

  return {
    createNote: createNote(noteRepo, mentionRepo),
    getNoteById: getNoteById(noteRepo),
    getRootNotes: getRootNotes(noteRepo),
    updateNote: updateNote(noteRepo, mentionRepo),
    deleteNote: deleteNote(noteRepo, mentionRepo),
  };
};

// ==========================================
// Legacy NoteService Class (Backward Compatibility)
// ==========================================

/**
 * Legacy NoteService class for backward compatibility.
 * Used by routes/mentions.ts
 * @deprecated Use createFunctionalNoteService instead
 */
export class NoteService {
  private noteRepo: NoteRepository;
  private mentionRepo: MentionRepository;
  private mentionService: MentionService;

  constructor({ db }: { db: Database }) {
    this.noteRepo = new NoteRepository({ db });
    this.mentionRepo = new MentionRepository({ db });
    this.mentionService = new MentionService({ db });
  }

  async createNote(data: {
    content: string;
    parentId?: string;
    mentions?: string[];
  }): Promise<Note> {
    // Validate length (from clarifications: 1000 char limit)
    if (data.content.length < 1 || data.content.length > MAX_NOTE_LENGTH) {
      throw new Error(`Note content must be between 1 and ${MAX_NOTE_LENGTH} characters`);
    }

    // Generate ID first for validation
    const noteId = generateId();

    // Extract mentions and validate BEFORE creating note
    const mentionIds = extractMentions(data.content);
    if (mentionIds.length > 0) {
      await this.mentionService.validateMentions(noteId, mentionIds);
    }

    // Calculate depth and enforce 2-level constraint
    let depth = 0;
    if (data.parentId) {
      const parent = await this.noteRepo.findById(data.parentId);
      if (!parent) {
        throw new Error('Parent note not found');
      }

      // NOTE: Enforce 2-level constraint - children cannot have children
      if (parent.depth >= 1) {
        throw new Error('Cannot create child for a note that is already a child');
      }

      depth = 1; // Children always have depth 1
    }

    // Create note (validation passed)
    const note = await this.noteRepo.create({
      id: noteId,
      content: data.content,
      parentId: data.parentId,
      depth,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save mentions (already validated)
    for (const mentionId of mentionIds) {
      const positions = getMentionPositions(data.content, mentionId);
      for (const position of positions) {
        await this.mentionRepo.create({
          id: generateId(),
          fromNoteId: note.id,
          toNoteId: mentionId,
          position,
          createdAt: new Date(),
        });
      }
    }

    return note;
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    return this.noteRepo.findById(id);
  }

  /**
   * Get note by ID with Result type for type-safe error handling.
   * Returns NoteNotFoundError if note doesn't exist.
   */
  getNoteByIdResult(id: string): ResultAsync<Note, NoteError> {
    return ResultAsync.fromPromise(
      this.noteRepo.findById(id),
      (error) => databaseError('Failed to fetch note', error)
    ).andThen((note) => {
      if (!note) {
        return err(noteNotFoundError(id));
      }
      return ok(note);
    });
  }

  async getRootNotes(limit: number = 20, offset: number = 0) {
    const notes = await this.noteRepo.findRootNotes(limit, offset);
    const total = await this.noteRepo.countRootNotes();
    const hasMore = offset + notes.length < total;

    return { notes, total, hasMore };
  }

  async updateNote(id: string, data: { content: string }): Promise<Note> {
    // Validate length
    if (data.content.length < 1 || data.content.length > MAX_NOTE_LENGTH) {
      throw new Error(`Note content must be between 1 and ${MAX_NOTE_LENGTH} characters`);
    }

    const existing = await this.noteRepo.findById(id);
    if (!existing) {
      throw new Error('Note not found');
    }

    // Extract and validate new mentions BEFORE updating
    const mentionIds = extractMentions(data.content);
    if (mentionIds.length > 0) {
      await this.mentionService.validateMentions(id, mentionIds);
    }

    // Delete old mentions
    await this.mentionRepo.deleteByNoteId(id);

    // Update note (validation passed)
    const updated = await this.noteRepo.update(id, data.content);

    // Re-create mentions (already validated)
    for (const mentionId of mentionIds) {
      const positions = getMentionPositions(data.content, mentionId);
      for (const position of positions) {
        await this.mentionRepo.create({
          id: generateId(),
          fromNoteId: id,
          toNoteId: mentionId,
          position,
          createdAt: new Date(),
        });
      }
    }

    return updated;
  }
}
