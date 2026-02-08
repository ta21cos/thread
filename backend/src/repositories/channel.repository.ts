/**
 * Channel Repository Implementation
 *
 * チャネルリポジトリの実装。
 * ResultAsync を使用して型安全なエラーハンドリングを提供。
 */

import type { ResultAsync } from 'neverthrow';
import { eq, and, asc } from 'drizzle-orm';
import { channels, type Channel, type NewChannel, type Database } from '../db';
import type { NoteError } from '../errors/domain-errors';
import { dbQuery, dbQueryFirst, dbInsertReturning, dbUpdateReturning, dbDelete } from './helpers';

// ==========================================
// Repository Interface
// ==========================================

export interface ChannelRepository {
  readonly findById: (id: string) => ResultAsync<Channel | undefined, NoteError>;
  readonly findByAuthorId: (authorId: string) => ResultAsync<Channel[], NoteError>;
  readonly create: (channel: NewChannel) => ResultAsync<Channel, NoteError>;
  readonly update: (
    id: string,
    data: Partial<Pick<Channel, 'name' | 'color' | 'icon' | 'sortOrder'>>
  ) => ResultAsync<Channel, NoteError>;
  readonly delete: (id: string) => ResultAsync<void, NoteError>;
  readonly findByAuthorAndName: (
    authorId: string,
    name: string
  ) => ResultAsync<Channel | undefined, NoteError>;
}

// ==========================================
// Repository Implementation (Factory)
// ==========================================

export const createChannelRepository = ({ db }: { db: Database }): ChannelRepository => ({
  findById: (id) =>
    dbQueryFirst(db.select().from(channels).where(eq(channels.id, id)), 'Failed to find channel'),

  findByAuthorId: (authorId) =>
    dbQuery(
      db
        .select()
        .from(channels)
        .where(eq(channels.authorId, authorId))
        .orderBy(asc(channels.sortOrder), asc(channels.createdAt)),
      'Failed to find channels by author'
    ),

  create: (channel) =>
    dbInsertReturning(db.insert(channels).values(channel).returning(), 'Failed to create channel'),

  update: (id, data) =>
    dbUpdateReturning(
      db
        .update(channels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(channels.id, id))
        .returning(),
      'Failed to update channel'
    ),

  delete: (id) =>
    dbDelete(db.delete(channels).where(eq(channels.id, id)), 'Failed to delete channel'),

  findByAuthorAndName: (authorId, name) =>
    dbQueryFirst(
      db
        .select()
        .from(channels)
        .where(and(eq(channels.authorId, authorId), eq(channels.name, name))),
      'Failed to find channel by name'
    ),
});
