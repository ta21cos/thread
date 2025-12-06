import { SearchRepository } from '../repositories/search.repository';
import {
  createMentionRepository,
  type MentionRepository,
} from '../repositories/mention.repository';
import type { Note, Database } from '../db';

// NOTE: Service for content search
export class SearchService {
  private searchRepo: SearchRepository;
  private mentionRepo: MentionRepository;

  constructor({ db }: { db: Database }) {
    this.searchRepo = new SearchRepository({ db });
    this.mentionRepo = createMentionRepository({ db });
  }

  async searchByContent(query: string, limit: number = 20): Promise<Note[]> {
    return this.searchRepo.searchByContent(query, limit);
  }

  async searchByMention(noteId: string): Promise<Note[]> {
    const mentionsWithNotesResult = await this.mentionRepo.getMentionsWithNotes(noteId);
    if (mentionsWithNotesResult.isErr()) {
      throw new Error(mentionsWithNotesResult.error.message);
    }
    return mentionsWithNotesResult.value.map((m) => m.notes);
  }
}
