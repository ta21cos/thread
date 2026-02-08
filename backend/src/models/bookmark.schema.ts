import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { notes } from './note.schema';
import { profiles } from './profile.schema';

// NOTE: Bookmark schema for marking important notes
export const bookmarks = sqliteTable(
  'bookmarks',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_bookmarks_author').on(table.authorId),
    unique('unique_bookmark').on(table.noteId, table.authorId),
  ]
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
