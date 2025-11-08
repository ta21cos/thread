import { eq, or } from 'drizzle-orm';
import { db, mentions, notes, type Mention, type NewMention } from '../db';

// NOTE: Repository for Mention operations
export class MentionRepository {
  async create(mention: NewMention): Promise<Mention> {
    const [created] = await db.insert(mentions).values(mention).returning();
    return created;
  }

  async findByToNoteId(toNoteId: string): Promise<Mention[]> {
    return db.select().from(mentions).where(eq(mentions.toNoteId, toNoteId));
  }

  async findByFromNoteId(fromNoteId: string): Promise<Mention[]> {
    return db.select().from(mentions).where(eq(mentions.fromNoteId, fromNoteId));
  }

  async deleteByNoteId(noteId: string): Promise<void> {
    // NOTE: Delete mentions where note is either sender OR receiver
    await db
      .delete(mentions)
      .where(
        or(eq(mentions.fromNoteId, noteId), eq(mentions.toNoteId, noteId))
      );
  }

  async getMentionsWithNotes(toNoteId: string) {
    return db
      // @ts-ignore - Drizzle type inference issue with select() in joins
      .select({
        mention: mentions,
        note: notes,
      })
      .from(mentions)
      .innerJoin(notes, eq(mentions.fromNoteId, notes.id))
      .where(eq(mentions.toNoteId, toNoteId));
  }

  async getAllMentions(): Promise<Map<string, string[]>> {
    const allMentions = await db.select().from(mentions);
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
