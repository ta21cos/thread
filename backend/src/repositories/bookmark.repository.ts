/**
 * Bookmark Repository Implementation
 *
 * ブックマークリポジトリの実装。
 */

import type { ResultAsync } from 'neverthrow';
import { eq, and, desc } from 'drizzle-orm';
import { bookmarks, type Bookmark, type NewBookmark, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface BookmarkRepository {
  readonly findById: (id: string) => ResultAsync<Bookmark | undefined, NoteError>;
  readonly findByNoteAndAuthor: (
    noteId: string,
    authorId: string
  ) => ResultAsync<Bookmark | undefined, NoteError>;
  readonly findByAuthorId: (authorId: string, limit?: number) => ResultAsync<Bookmark[], NoteError>;
  readonly create: (bookmark: NewBookmark) => ResultAsync<Bookmark, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
  readonly deleteByNoteAndAuthor: (
    noteId: string,
    authorId: string
  ) => ResultAsync<void, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createBookmarkRepository = ({ db }: { db: Database }): BookmarkRepository => ({
  findById: (id) =>
    dbQueryFirst(
      db.select().from(bookmarks).where(eq(bookmarks.id, id)),
      'Failed to find bookmark'
    ),

  findByNoteAndAuthor: (noteId, authorId) =>
    dbQueryFirst(
      db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.noteId, noteId), eq(bookmarks.authorId, authorId))),
      'Failed to find bookmark by note and author'
    ),

  findByAuthorId: (authorId, limit = 100) =>
    dbQuery(
      db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.authorId, authorId))
        .orderBy(desc(bookmarks.createdAt))
        .limit(limit),
      'Failed to find bookmarks by author'
    ),

  create: (bookmark) =>
    dbInsertReturning(
      db.insert(bookmarks).values(bookmark).returning(),
      'Failed to create bookmark'
    ),

  delete: (id) =>
    dbDelete(db.delete(bookmarks).where(eq(bookmarks.id, id)), 'Failed to delete bookmark'),

  deleteByNoteAndAuthor: (noteId, authorId) =>
    dbDelete(
      db
        .delete(bookmarks)
        .where(and(eq(bookmarks.noteId, noteId), eq(bookmarks.authorId, authorId))),
      'Failed to delete bookmark'
    ),
});
