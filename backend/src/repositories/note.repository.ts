/**
 * Note Repository Implementation
 *
 * 関数型アプローチによるノートリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync, okAsync } from 'neverthrow';
import { eq, isNull, desc, asc, and } from 'drizzle-orm';
import { notes, type Note, type NewNote, type NoteWithReplyCount, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbUpdateReturning } from './helpers';

// ==========================================
// Pure Helper Functions
// ==========================================

/**
 * ノートを depth と createdAt でソート
 */
const sortByDepthAndCreatedAt = (noteList: Note[]): Note[] =>
  [...noteList].sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

/**
 * ノートに replyCount を付与
 */
const attachReplyCount = (note: Note, replyCount: number): NoteWithReplyCount => ({
  ...note,
  replyCount,
});

// ==========================================
// Repository Interface
// ==========================================

/** リポジトリインターフェース (依存性注入用) */
export interface NoteRepository {
  readonly findById: (id: string, authorId: string) => ResultAsync<Note | undefined, NoteError>;
  readonly create: (note: NewNote) => ResultAsync<Note, NoteError>;
  readonly update: (id: string, authorId: string, content: string) => ResultAsync<Note, NoteError>;
  readonly updateHidden: (
    id: string,
    authorId: string,
    isHidden: boolean
  ) => ResultAsync<Note, NoteError>;
  readonly findRootNotes: (
    authorId: string,
    limit: number,
    offset: number,
    includeHidden?: boolean
  ) => ResultAsync<NoteWithReplyCount[], NoteError>;
  readonly countRootNotes: (
    authorId: string,
    includeHidden?: boolean
  ) => ResultAsync<number, NoteError>;
  readonly findByParentId: (parentId: string, authorId: string) => ResultAsync<Note[], NoteError>;
  readonly delete: (id: string, authorId: string) => ResultAsync<void, NoteError>;
  readonly getThreadRecursive: (rootId: string, authorId: string) => ResultAsync<Note[], NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

/**
 * ノートリポジトリを作成
 */
export const createNoteRepository = ({ db }: { db: Database }): NoteRepository => {
  // 内部ヘルパー: 子ノートを取得（authorId でフィルタ）
  const fetchChildren = (parentId: string, authorId: string): ResultAsync<Note[], NoteError> =>
    dbQuery(
      db
        .select()
        .from(notes)
        .where(and(eq(notes.parentId, parentId), eq(notes.authorId, authorId)))
        .orderBy(asc(notes.createdAt)),
      'Failed to fetch children'
    );

  // 内部ヘルパー: 返信数を付与（authorId でフィルタ）
  const countReplies = (note: Note, authorId: string): ResultAsync<NoteWithReplyCount, NoteError> =>
    dbQuery(
      db
        .select()
        .from(notes)
        .where(and(eq(notes.parentId, note.id), eq(notes.authorId, authorId))),
      'Failed to count replies'
    ).map((replies) => attachReplyCount(note, replies.length));

  // 内部ヘルパー: ノートとその子孫を再帰的に取得（authorId でフィルタ）
  const fetchWithDescendants = (id: string, authorId: string): ResultAsync<Note[], NoteError> =>
    dbQueryFirst(
      db
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.authorId, authorId))),
      'Failed to fetch note'
    ).andThen((note) =>
      note
        ? fetchChildren(id, authorId)
            .andThen((children) =>
              children.length === 0
                ? okAsync<Note[][], NoteError>([])
                : ResultAsync.combine(
                    children.map((child) => fetchWithDescendants(child.id, authorId))
                  )
            )
            .map((nestedChildren) => [note, ...nestedChildren.flat()])
        : okAsync([])
    );

  return {
    findById: (id, authorId) =>
      dbQueryFirst(
        db
          .select()
          .from(notes)
          .where(and(eq(notes.id, id), eq(notes.authorId, authorId))),
        'Failed to find note'
      ),

    create: (note) =>
      dbInsertReturning(db.insert(notes).values(note).returning(), 'Failed to create note'),

    update: (id, authorId, content) =>
      dbUpdateReturning(
        db
          .update(notes)
          .set({ content, updatedAt: new Date() })
          .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
          .returning(),
        'Failed to update note'
      ),

    updateHidden: (id, authorId, isHidden) =>
      dbUpdateReturning(
        db
          .update(notes)
          .set({ isHidden, updatedAt: new Date() })
          .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
          .returning(),
        'Failed to update note hidden status'
      ),

    findRootNotes: (authorId, limit, offset, includeHidden = false) => {
      const condition = includeHidden
        ? and(isNull(notes.parentId), eq(notes.authorId, authorId))
        : and(isNull(notes.parentId), eq(notes.isHidden, false), eq(notes.authorId, authorId));

      return dbQuery(
        db
          .select()
          .from(notes)
          .where(condition)
          .orderBy(desc(notes.createdAt))
          .limit(limit)
          .offset(offset),
        'Failed to find root notes'
      ).andThen((rootNotes) =>
        ResultAsync.combine(rootNotes.map((note) => countReplies(note, authorId)))
      );
    },

    countRootNotes: (authorId, includeHidden = false) => {
      const condition = includeHidden
        ? and(isNull(notes.parentId), eq(notes.authorId, authorId))
        : and(isNull(notes.parentId), eq(notes.isHidden, false), eq(notes.authorId, authorId));

      return dbQuery(
        db
          .select()
          .from(notes)
          .where(condition)
          .then((result) => result.length),
        'Failed to count root notes'
      );
    },

    findByParentId: (parentId, authorId) =>
      dbQuery(
        db
          .select()
          .from(notes)
          .where(and(eq(notes.parentId, parentId), eq(notes.authorId, authorId))),
        'Failed to find notes by parent id'
      ),

    delete: (id, authorId) =>
      dbQuery(
        db
          .delete(notes)
          .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
          .then(() => undefined),
        'Failed to delete note'
      ),

    getThreadRecursive: (rootId, authorId) =>
      fetchWithDescendants(rootId, authorId).map(sortByDepthAndCreatedAt),
  };
};
