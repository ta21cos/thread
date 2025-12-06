/**
 * Mention Repository Implementation
 *
 * 関数型アプローチによるメンションリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import { ResultAsync } from 'neverthrow';
import { eq, or } from 'drizzle-orm';
import { mentions, notes, type Mention, type NewMention, type Note, type Database } from '../db';
import { databaseError, type NoteError } from '../errors/domain-errors';

export interface MentionRepository {
  create: (mention: NewMention) => ResultAsync<void, NoteError>;
  deleteByNoteId: (noteId: string) => ResultAsync<void, NoteError>;
  getAllMentions: () => ResultAsync<Map<string, string[]>, NoteError>;
  findByToNoteId: (toNoteId: string) => ResultAsync<Mention[], NoteError>;
  findByFromNoteId: (fromNoteId: string) => ResultAsync<Mention[], NoteError>;
  getMentionsWithNotes: (
    toNoteId: string
  ) => ResultAsync<Array<{ mentions: Mention; notes: Note }>, NoteError>;
}

/**
 * デフォルトのメンションリポジトリ実装
 */
export const createMentionRepository = ({ db }: { db: Database }): MentionRepository => ({
  create: (mention: NewMention): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db
        .insert(mentions)
        .values(mention)
        .then(() => undefined),
      (error) => databaseError('Failed to create mention', error)
    ),

  deleteByNoteId: (noteId: string): ResultAsync<void, NoteError> =>
    ResultAsync.fromPromise(
      db
        .delete(mentions)
        .where(or(eq(mentions.fromNoteId, noteId), eq(mentions.toNoteId, noteId)))
        .then(() => undefined),
      (error) => databaseError('Failed to delete mentions', error)
    ),

  getAllMentions: (): ResultAsync<Map<string, string[]>, NoteError> =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(mentions)
        .then((allMentions) => {
          const graph = new Map<string, string[]>();
          for (const mention of allMentions) {
            if (!graph.has(mention.fromNoteId)) {
              graph.set(mention.fromNoteId, []);
            }
            graph.get(mention.fromNoteId)!.push(mention.toNoteId);
          }
          return graph;
        }),
      (error) => databaseError('Failed to get mentions', error)
    ),

  findByToNoteId: (toNoteId: string): ResultAsync<Mention[], NoteError> =>
    ResultAsync.fromPromise(
      db.select().from(mentions).where(eq(mentions.toNoteId, toNoteId)),
      (error) => databaseError('Failed to find mentions by to note id', error)
    ),

  findByFromNoteId: (fromNoteId: string): ResultAsync<Mention[], NoteError> =>
    ResultAsync.fromPromise(
      db.select().from(mentions).where(eq(mentions.fromNoteId, fromNoteId)),
      (error) => databaseError('Failed to find mentions by from note id', error)
    ),

  getMentionsWithNotes: (
    toNoteId: string
  ): ResultAsync<Array<{ mentions: Mention; notes: Note }>, NoteError> =>
    ResultAsync.fromPromise(
      (async () => {
        // Get all mentions for this note
        const allMentions = await db.select().from(mentions).where(eq(mentions.toNoteId, toNoteId));

        // Fetch the notes for each mention
        const results = await Promise.all(
          allMentions.map(async (mention) => {
            const [note] = await db.select().from(notes).where(eq(notes.id, mention.fromNoteId));
            return {
              mentions: mention,
              notes: note!,
            };
          })
        );

        return results;
      })(),
      (error) => databaseError('Failed to get mentions with notes', error)
    ),
});
