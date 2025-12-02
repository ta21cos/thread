import { eq, or } from 'drizzle-orm';
import { mentions, notes, type Mention, type NewMention, type Note, type Database } from '../db';

// NOTE: Repository for Mention operations
export class MentionRepository {
  private db: Database;

  constructor({ db: _db }: { db: Database }) {
    this.db = _db;
  }

  async create(mention: NewMention): Promise<Mention> {
    const [created] = await this.db.insert(mentions).values(mention).returning();
    return created;
  }

  async findByToNoteId(toNoteId: string): Promise<Mention[]> {
    return this.db.select().from(mentions).where(eq(mentions.toNoteId, toNoteId));
  }

  async findByFromNoteId(fromNoteId: string): Promise<Mention[]> {
    return this.db.select().from(mentions).where(eq(mentions.fromNoteId, fromNoteId));
  }

  async deleteByNoteId(noteId: string): Promise<void> {
    // NOTE: Delete mentions where note is either sender OR receiver
    await this.db
      .delete(mentions)
      .where(or(eq(mentions.fromNoteId, noteId), eq(mentions.toNoteId, noteId)));
  }

  async getMentionsWithNotes(toNoteId: string): Promise<Array<{ mentions: Mention; notes: Note }>> {
    // NOTE: Get all mentions for this note
    const allMentions = await this.db
      .select()
      .from(mentions)
      .where(eq(mentions.toNoteId, toNoteId));

    // NOTE: Fetch the notes for each mention
    const results = await Promise.all(
      allMentions.map(async (mention) => {
        const [note] = await this.db.select().from(notes).where(eq(notes.id, mention.fromNoteId));
        return {
          mentions: mention,
          notes: note,
        };
      })
    );

    return results;
  }

  async getAllMentions(): Promise<Map<string, string[]>> {
    const allMentions = await this.db.select().from(mentions);
    const graph = new Map<string, string[]>();

    for (const mention of allMentions) {
      if (!graph.has(mention.fromNoteId)) {
        graph.set(mention.fromNoteId, []);
      }
      graph.get(mention.fromNoteId)!.push(mention.toNoteId);
    }

    return graph;
  }
}
