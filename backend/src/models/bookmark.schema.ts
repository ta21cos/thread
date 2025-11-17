import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { notes } from './note.schema';
import { profiles } from './profile.schema';

// NOTE: Drizzle schema for user bookmarks (per-user feature)
export const bookmarks = sqliteTable(
  'user_bookmarks',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueBookmark: unique().on(table.userId, table.noteId),
    userIdIdx: index('user_bookmarks_user_id_idx').on(table.userId),
    noteIdIdx: index('user_bookmarks_note_id_idx').on(table.noteId),
  })
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
