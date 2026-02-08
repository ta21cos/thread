import { sqliteTable, text, integer, unique, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profile.schema';
import { channels } from './channel.schema';

// NOTE: Scratch pad schema for quick note-taking
// Each user has one scratch pad per channel (or one global if channel is null)
export const scratchPads = sqliteTable(
  'scratch_pads',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    channelId: text('channel_id').references((): AnySQLiteColumn => channels.id, {
      onDelete: 'set null',
    }),
    content: text('content').notNull().default(''),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [unique('unique_scratch_pad').on(table.authorId, table.channelId)]
);

export type ScratchPad = typeof scratchPads.$inferSelect;
export type NewScratchPad = typeof scratchPads.$inferInsert;
