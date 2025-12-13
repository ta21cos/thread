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
import { dbQuery, dbQueryFirst } from './helpers';

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
  readonly findById: (id: string) => ResultAsync<Note | undefined, NoteError>;
  readonly create: (note: NewNote) => ResultAsync<Note, NoteError>;
  readonly update: (id: string, content: string) => ResultAsync<Note, NoteError>;
  readonly findRootNotes: (
    limit: number,
    offset: number,
    includeHidden?: boolean
  ) => ResultAsync<NoteWithReplyCount[], NoteError>;
  readonly countRootNotes: (includeHidden?: boolean) => ResultAsync<number, NoteError>;
  readonly findByParentId: (parentId: string) => ResultAsync<Note[], NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
  readonly getThreadRecursive: (rootId: string) => ResultAsync<Note[], NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

/**
 * ノートリポジトリを作成
 */
export const createNoteRepository = ({ db }: { db: Database }): NoteRepository => {
  // 内部ヘルパー: 子ノートを取得
  const fetchChildren = (parentId: string): ResultAsync<Note[], NoteError> =>
    dbQuery(
      db.select().from(notes).where(eq(notes.parentId, parentId)).orderBy(asc(notes.createdAt)),
      'Failed to fetch children'
    );

  // 内部ヘルパー: 返信数を付与
  const countReplies = (note: Note): ResultAsync<NoteWithReplyCount, NoteError> =>
    dbQuery(
      db.select().from(notes).where(eq(notes.parentId, note.id)),
      'Failed to count replies'
    ).map((replies) => attachReplyCount(note, replies.length));

  // 内部ヘルパー: ノートとその子孫を再帰的に取得
  const fetchWithDescendants = (id: string): ResultAsync<Note[], NoteError> =>
    dbQueryFirst(db.select().from(notes).where(eq(notes.id, id)), 'Failed to fetch note').andThen(
      (note) =>
        note
          ? fetchChildren(id)
              .andThen((children) =>
                children.length === 0
                  ? okAsync<Note[][], NoteError>([])
                  : ResultAsync.combine(children.map((child) => fetchWithDescendants(child.id)))
              )
              .map((nestedChildren) => [note, ...nestedChildren.flat()])
          : okAsync([])
    );

  return {
    findById: (id) =>
      dbQueryFirst(db.select().from(notes).where(eq(notes.id, id)), 'Failed to find note'),

    create: (note) =>
      dbQuery(
        db
          .insert(notes)
          .values(note)
          .returning()
          .then(([created]) => created),
        'Failed to create note'
      ),

    update: (id, content) =>
      dbQuery(
        db
          .update(notes)
          .set({ content, updatedAt: new Date() })
          .where(eq(notes.id, id))
          .returning()
          .then(([updated]) => updated),
        'Failed to update note'
      ),

    findRootNotes: (limit, offset, includeHidden = false) => {
      const condition = includeHidden
        ? isNull(notes.parentId)
        : and(isNull(notes.parentId), eq(notes.isHidden, false));

      return dbQuery(
        db
          .select()
          .from(notes)
          .where(condition)
          .orderBy(desc(notes.createdAt))
          .limit(limit)
          .offset(offset),
        'Failed to find root notes'
      ).andThen((rootNotes) => ResultAsync.combine(rootNotes.map(countReplies)));
    },

    countRootNotes: (includeHidden = false) => {
      const condition = includeHidden
        ? isNull(notes.parentId)
        : and(isNull(notes.parentId), eq(notes.isHidden, false));

      return dbQuery(
        db
          .select()
          .from(notes)
          .where(condition)
          .then((result) => result.length),
        'Failed to count root notes'
      );
    },

    findByParentId: (parentId) =>
      dbQuery(
        db.select().from(notes).where(eq(notes.parentId, parentId)),
        'Failed to find notes by parent id'
      ),

    delete: (id) =>
      dbQuery(
        db
          .delete(notes)
          .where(eq(notes.id, id))
          .then(() => undefined),
        'Failed to delete note'
      ),

    getThreadRecursive: (rootId) => fetchWithDescendants(rootId).map(sortByDepthAndCreatedAt),
  };
};
