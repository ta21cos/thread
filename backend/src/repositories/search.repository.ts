import { notes } from '../models/note.schema';
import { like, desc } from 'drizzle-orm';
import type { Note, Database } from '../db';

// NOTE: Repository for content search using advanced Drizzle ORM features
export class SearchRepository {
  private db: Database;

  constructor({ db: _db }: { db: Database }) {
    this.db = _db;
  }

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    // NOTE: Use prepared statement for better performance
    const likePattern = `%${query}%`;

    const result = await this.db
      .select()
      .from(notes)
      .where(like(notes.content, likePattern))
      .orderBy(desc(notes.updatedAt))
      .limit(limit);

    return result;
  }
}
