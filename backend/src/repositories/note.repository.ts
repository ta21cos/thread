/**
 * Note Repository Implementation
 *
 * 関数型アプローチによるノートリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync, okAsync } from 'neverthrow';
import { eq, isNull, desc, asc } from 'drizzle-orm';
import { notes, type Note, type NewNote, type NoteWithReplyCount, type Database } from '../db';
import { databaseError, type NoteError } from '../errors/domain-errors';

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

/** リポジトリインターフェース (依存性注入用) */
export interface NoteRepository {
  findById: (id: string) => ResultAsync<Note | undefined, NoteError>;
  create: (note: NewNote) => ResultAsync<Note, NoteError>;
  update: (id: string, content: string) => ResultAsync<Note, NoteError>;
  findRootNotes: (limit: number, offset: number) => ResultAsync<NoteWithReplyCount[], NoteError>;
  countRootNotes: () => ResultAsync<number, NoteError>;
  findByParentId: (parentId: string) => ResultAsync<Note[], NoteError>;
  delete: (id: string) => ResultAsync<void, NoteError>;
  getThreadRecursive: (rootId: string) => ResultAsync<Note[], NoteError>;
}

/**
 * デフォルトのノートリポジトリ実装
 * データベース操作を ResultAsync でラップ
 */
export const createNoteRepository = ({ db }: { db: Database }): NoteRepository => ({
  findById: (id: string): ResultAsync<Note | undefined, NoteError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .then(([note]) => note),
      (error) => databaseError('Failed to find note', error)
    ),

  create: (note: NewNote): ResultAsync<Note, NoteError> =>
    ResultAsync.fromPromise(
      db
        .insert(notes)
        .values(note)
        .returning()
        .then(([created]) => created),
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

  findRootNotes: (limit: number, offset: number): ResultAsync<NoteWithReplyCount[], NoteError> => {
    // ルートノートを取得
    const fetchRootNotes = ResultAsync.fromPromise(
      db
        .select()
        .from(notes)
        .where(isNull(notes.parentId))
        .orderBy(desc(notes.createdAt))
        .limit(limit)
        .offset(offset),
      (error) => databaseError('Failed to find root notes', error)
    );

    // 各ノートの返信数を取得して付与
    const countReplies = (note: Note): ResultAsync<NoteWithReplyCount, NoteError> =>
      ResultAsync.fromPromise(db.select().from(notes).where(eq(notes.parentId, note.id)), (error) =>
        databaseError('Failed to count replies', error)
      ).map((replies) => attachReplyCount(note, replies.length));

    return fetchRootNotes.andThen((rootNotes) => ResultAsync.combine(rootNotes.map(countReplies)));
  },

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
    ResultAsync.fromPromise(db.select().from(notes).where(eq(notes.parentId, parentId)), (error) =>
      databaseError('Failed to find notes by parent id', error)
    ),

  delete: (id: string): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db
        .delete(notes)
        .where(eq(notes.id, id))
        .then(() => undefined),
      (error) => databaseError('Failed to delete note', error)
    ),

  getThreadRecursive: (rootId: string): ResultAsync<Note[], NoteError> => {
    // 単一ノートを取得
    const fetchNote = (id: string): ResultAsync<Note | undefined, NoteError> =>
      ResultAsync.fromPromise(
        db
          .select()
          .from(notes)
          .where(eq(notes.id, id))
          .then(([note]) => note),
        (error) => databaseError('Failed to fetch note', error)
      );

    // 子ノートを取得
    const fetchChildren = (parentId: string): ResultAsync<Note[], NoteError> =>
      ResultAsync.fromPromise(
        db.select().from(notes).where(eq(notes.parentId, parentId)).orderBy(asc(notes.createdAt)),
        (error) => databaseError('Failed to fetch children', error)
      );

    // ノートとその子孫を再帰的に取得
    const fetchWithDescendants = (id: string): ResultAsync<Note[], NoteError> =>
      fetchNote(id).andThen((note) =>
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

    return fetchWithDescendants(rootId).map(sortByDepthAndCreatedAt);
  },
});
