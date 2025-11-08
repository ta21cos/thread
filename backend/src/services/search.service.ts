import { SearchRepository } from '../repositories/search.repository';
import { MentionRepository } from '../repositories/mention.repository';
import type { Note } from '../db';

// NOTE: Service for content search
export class SearchService {
  private searchRepo = new SearchRepository();
  private mentionRepo = new MentionRepository();

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    return this.searchRepo.searchByContent(query, limit);
  }

  async searchByMention(noteId: string): Promise<Note[]> {
    const mentionsWithNotes = await this.mentionRepo.getMentionsWithNotes(noteId);
    // @ts-ignore - Drizzle returns `notes` from join
    return mentionsWithNotes.map((m) => m.notes);
  }
}

export const searchService = new SearchService();
