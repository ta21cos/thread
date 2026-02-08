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

// NOTE: Daily note schema for mapping dates to notes
// One daily note per user per date
export const dailyNotes = sqliteTable(
  'daily_notes',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD format
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_daily_notes_date').on(table.date),
    unique('unique_daily_note').on(table.authorId, table.date),
  ]
);

export type DailyNote = typeof dailyNotes.$inferSelect;
export type NewDailyNote = typeof dailyNotes.$inferInsert;
