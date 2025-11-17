import { eq, and, desc } from 'drizzle-orm';
import { db, bookmarks, notes, type Bookmark, type NewBookmark, type Note } from '../db';

// NOTE: Repository for Bookmark CRUD operations (per-user bookmarks)
export class BookmarkRepository {
  async create(bookmark: NewBookmark): Promise<Bookmark> {
    const [created] = await db.insert(bookmarks).values(bookmark).returning();
    return created;
  }

  async findByUserIdAndNoteId(userId: string, noteId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.noteId, noteId)));
    return bookmark;
  }

  async existsForUser(userId: string, noteId: string): Promise<boolean> {
    const bookmark = await this.findByUserIdAndNoteId(userId, noteId);
    return !!bookmark;
  }

  async findByUserId(userId: string, limit: number, offset: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findBookmarkedNotesByUserId(
    userId: string,
    limit: number,
    offset: number
  ): Promise<Note[]> {
    // Get bookmarked note IDs first (ordered by bookmark creation time)
    const bookmarkedItems = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    if (bookmarkedItems.length === 0) {
      return [];
    }

    // Fetch the actual notes in order
    const result: Note[] = [];
    for (const bookmark of bookmarkedItems) {
      const [note] = await db.select().from(notes).where(eq(notes.id, bookmark.noteId));
      if (note) {
        result.push(note);
      }
    }

    return result;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
    return result.length;
  }

  async delete(userId: string, noteId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.noteId, noteId)));
  }

  async deleteByNoteId(noteId: string): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.noteId, noteId));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await db.delete(bookmarks).where(eq(bookmarks.userId, userId));
  }
}
