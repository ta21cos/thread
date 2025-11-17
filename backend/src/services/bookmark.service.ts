import { BookmarkRepository } from '../repositories/bookmark.repository';
import { NoteRepository } from '../repositories/note.repository';
import { generateId } from '../utils/id-generator';
import type { Note } from '../db';

// NOTE: Service layer for Bookmark business logic with per-user support
export class BookmarkService {
  private bookmarkRepo = new BookmarkRepository();
  private noteRepo = new NoteRepository();

  async toggleBookmark(userId: string, noteId: string): Promise<{ bookmarked: boolean }> {
    // Validate note exists
    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Check if bookmark already exists
    const existingBookmark = await this.bookmarkRepo.findByUserIdAndNoteId(userId, noteId);

    if (existingBookmark) {
      // Remove bookmark
      await this.bookmarkRepo.delete(userId, noteId);
      return { bookmarked: false };
    } else {
      // Create bookmark
      await this.bookmarkRepo.create({
        id: generateId(),
        userId,
        noteId,
        createdAt: new Date(),
      });
      return { bookmarked: true };
    }
  }

  async getBookmarkedNotes(
    userId: string,
    limit: number,
    offset: number
  ): Promise<{
    notes: Note[];
    total: number;
    hasMore: boolean;
  }> {
    const notes = await this.bookmarkRepo.findBookmarkedNotesByUserId(userId, limit, offset);
    const total = await this.bookmarkRepo.countByUserId(userId);
    const hasMore = offset + limit < total;

    return { notes, total, hasMore };
  }

  async isBookmarkedByUser(userId: string, noteId: string): Promise<boolean> {
    return await this.bookmarkRepo.existsForUser(userId, noteId);
  }
}

// Export singleton instance
export const bookmarkService = new BookmarkService();
