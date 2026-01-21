import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { notes } from './note.schema';

// NOTE: Search index table for storing searchable content
export const searchIndex = sqliteTable('search_index', {
  noteId: text('note_id')
    .primaryKey()
    .references(() => notes.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // Preprocessed searchable text
  tokens: text('tokens').notNull(), // JSON array of stemmed words
  mentions: text('mentions'), // JSON array of note IDs
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type SearchIndex = typeof searchIndex.$inferSelect;
export type NewSearchIndex = typeof searchIndex.$inferInsert;
