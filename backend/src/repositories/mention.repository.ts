/**
 * Mention Repository Implementation
 *
 * 関数型アプローチによるメンションリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync } from 'neverthrow';
import { eq, or, and } from 'drizzle-orm';
import { mentions, notes, type Mention, type NewMention, type Note, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery } from './helpers';

// ==========================================
// Pure Helper Functions
// ==========================================

/**
 * メンション配列からグラフ構造を構築
 */
const buildMentionGraph = (allMentions: Mention[]): Map<string, string[]> => {
  const graph = new Map<string, string[]>();
  for (const mention of allMentions) {
    if (!graph.has(mention.fromNoteId)) {
      graph.set(mention.fromNoteId, []);
    }
    graph.get(mention.fromNoteId)!.push(mention.toNoteId);
  }
  return graph;
};

// ==========================================
// Repository Interface
// ==========================================

export interface MentionRepository {
  readonly create: (mention: NewMention) => ResultAsync<void, NoteError>;
  readonly deleteByNoteId: (noteId: string) => ResultAsync<void, NoteError>;
  readonly getAllMentions: () => ResultAsync<Map<string, string[]>, NoteError>;
  readonly findByToNoteId: (
    toNoteId: string,
    authorId: string
  ) => ResultAsync<Mention[], NoteError>;
  readonly findByFromNoteId: (fromNoteId: string) => ResultAsync<Mention[], NoteError>;
  readonly getMentionsWithNotes: (
    toNoteId: string,
    authorId: string
  ) => ResultAsync<Array<{ mentions: Mention; notes: Note }>, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

/**
 * メンションリポジトリを作成
 */
export const createMentionRepository = ({ db }: { db: Database }): MentionRepository => ({
  create: (mention) =>
    dbQuery(
      db
        .insert(mentions)
        .values(mention)
        .then(() => undefined),
      'Failed to create mention'
    ),

  deleteByNoteId: (noteId) =>
    dbQuery(
      db
        .delete(mentions)
        .where(or(eq(mentions.fromNoteId, noteId), eq(mentions.toNoteId, noteId)))
        .then(() => undefined),
      'Failed to delete mentions'
    ),

  getAllMentions: () =>
    dbQuery(db.select().from(mentions), 'Failed to get mentions').map(buildMentionGraph),

  findByToNoteId: (toNoteId, authorId) =>
    dbQuery(
      db
        .select()
        .from(mentions)
        .innerJoin(notes, eq(mentions.fromNoteId, notes.id))
        .where(and(eq(mentions.toNoteId, toNoteId), eq(notes.authorId, authorId)))
        .then((rows) => rows.map((r) => r.mentions)),
      'Failed to find mentions by to note id'
    ),

  findByFromNoteId: (fromNoteId) =>
    dbQuery(
      db.select().from(mentions).where(eq(mentions.fromNoteId, fromNoteId)),
      'Failed to find mentions by from note id'
    ),

  getMentionsWithNotes: (toNoteId, authorId) =>
    dbQuery(
      db
        .select()
        .from(mentions)
        .innerJoin(notes, eq(mentions.fromNoteId, notes.id))
        .where(and(eq(mentions.toNoteId, toNoteId), eq(notes.authorId, authorId)))
        .then((rows) => rows.map((r) => ({ mentions: r.mentions, notes: r.notes }))),
      'Failed to get mentions with notes'
    ),
});
