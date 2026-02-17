/**
 * Search Repository Implementation
 *
 * 関数型アプローチによる検索リポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync } from 'neverthrow';
import { like, desc, and, eq } from 'drizzle-orm';
import { notes, type Note, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface SearchRepository {
  readonly searchByContent: (
    authorId: string,
    query: string,
    limit?: number
  ) => ResultAsync<Note[], NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

/**
 * 検索リポジトリを作成
 */
export const createSearchRepository = ({ db }: { db: Database }): SearchRepository => ({
  searchByContent: (authorId, query, limit = 20) =>
    dbQuery(
      db
        .select()
        .from(notes)
        .where(and(like(notes.content, `%${query}%`), eq(notes.authorId, authorId)))
        .orderBy(desc(notes.updatedAt))
        .limit(limit),
      'Failed to search notes by content'
    ),
});
