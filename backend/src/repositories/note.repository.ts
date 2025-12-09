/**
 * Note Repository Implementation
 *
 * 関数型アプローチによるノートリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync } from 'neverthrow';
import { eq, isNull, desc, asc } from 'drizzle-orm';
import { notes, type Note, type NewNote, type NoteWithReplyCount, type Database } from '../db';
import { databaseError, type NoteError } from '../errors/domain-errors';

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

  findRootNotes: (limit: number, offset: number): ResultAsync<NoteWithReplyCount[], NoteError> =>
    ResultAsync.fromPromise(
      (async () => {
        const rootNotes = await db
          .select()
          .from(notes)
          .where(isNull(notes.parentId))
          .orderBy(desc(notes.createdAt))
          .limit(limit)
          .offset(offset);

        // Calculate replyCount for each root note
        const notesWithCounts: NoteWithReplyCount[] = await Promise.all(
          rootNotes.map(async (note) => {
            const replies = await db.select().from(notes).where(eq(notes.parentId, note.id));
            return {
              ...note,
              replyCount: replies.length,
            };
          })
        );

        return notesWithCounts;
      })(),
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

  getThreadRecursive: (rootId: string): ResultAsync<Note[], NoteError> =>
    ResultAsync.fromPromise(
      (async () => {
        // Use breadth-first traversal to build the thread
        const result: Note[] = [];
        const queue: string[] = [rootId];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const currentId = queue.shift()!;

          // Skip if already processed
          if (visited.has(currentId)) {
            continue;
          }
          visited.add(currentId);

          // Fetch current note
          const [currentNote] = await db.select().from(notes).where(eq(notes.id, currentId));

          if (!currentNote) {
            continue;
          }

          // Add to result
          result.push(currentNote);

          // Fetch children and add to queue
          const children = await db
            .select()
            .from(notes)
            .where(eq(notes.parentId, currentId))
            .orderBy(asc(notes.createdAt));

          // Add children to queue
          for (const child of children) {
            queue.push(child.id);
          }
        }

        // Sort by depth and createdAt to maintain order
        result.sort((a, b) => {
          if (a.depth !== b.depth) {
            return a.depth - b.depth;
          }
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return aTime - bTime;
        });

        return result;
      })(),
      (error) => databaseError('Failed to get thread recursive', error)
    ),
});
