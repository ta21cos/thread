import { sqliteTable, text, integer, AnySQLiteColumn, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profile.schema';
import { channels } from './channel.schema';

// NOTE: Drizzle schema for Note entity with 1000 char limit (from clarifications)
// NOTE: authorId is required - set from auth token on the server side
export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, {
        onDelete: 'cascade',
      }),
    parentId: text('parent_id').references((): AnySQLiteColumn => notes.id, {
      onDelete: 'cascade',
    }),
    channelId: text('channel_id')
      .notNull()
      .references((): AnySQLiteColumn => channels.id, {
        onDelete: 'restrict',
      }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    depth: integer('depth').notNull().default(0),
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [index('idx_notes_channel').on(table.channelId)]
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteWithReplyCount = Note & { replyCount: number };
