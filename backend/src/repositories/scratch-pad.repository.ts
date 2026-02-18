/**
 * Scratch Pad Repository Implementation
 */

import type { ResultAsync } from 'neverthrow';
import { eq, and } from 'drizzle-orm';
import { scratchPads, type ScratchPad, type NewScratchPad, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQueryFirst, dbInsertReturning, dbUpdateReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface ScratchPadRepository {
  readonly findById: (id: string) => ResultAsync<ScratchPad | undefined, NoteError>;
  readonly findByAuthorAndChannel: (
    authorId: string,
    channelId: string
  ) => ResultAsync<ScratchPad | undefined, NoteError>;
  readonly create: (scratchPad: NewScratchPad) => ResultAsync<ScratchPad, NoteError>;
  readonly update: (id: string, content: string) => ResultAsync<ScratchPad, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createScratchPadRepository = ({ db }: { db: Database }): ScratchPadRepository => ({
  findById: (id) =>
    dbQueryFirst(
      db.select().from(scratchPads).where(eq(scratchPads.id, id)),
      'Failed to find scratch pad'
    ),

  findByAuthorAndChannel: (authorId, channelId) =>
    dbQueryFirst(
      db
        .select()
        .from(scratchPads)
        .where(and(eq(scratchPads.authorId, authorId), eq(scratchPads.channelId, channelId))),
      'Failed to find scratch pad by author and channel'
    ),

  create: (scratchPad) =>
    dbInsertReturning(
      db.insert(scratchPads).values(scratchPad).returning(),
      'Failed to create scratch pad'
    ),

  update: (id, content) =>
    dbUpdateReturning(
      db
        .update(scratchPads)
        .set({ content, updatedAt: new Date() })
        .where(eq(scratchPads.id, id))
        .returning(),
      'Failed to update scratch pad'
    ),

  delete: (id) =>
    dbDelete(db.delete(scratchPads).where(eq(scratchPads.id, id)), 'Failed to delete scratch pad'),
});
