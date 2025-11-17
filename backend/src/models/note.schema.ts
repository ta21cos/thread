import { sqliteTable, text, integer, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profile.schema';

// NOTE: Drizzle schema for Note entity with 1000 char limit (from clarifications)
// NOTE: authorId is nullable for now, will be required after Clerk auth is fully implemented
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  authorId: text('author_id').references((): AnySQLiteColumn => profiles.id, {
    onDelete: 'cascade',
  }),
  parentId: text('parent_id').references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  depth: integer('depth').notNull().default(0),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteWithReplyCount = Note & { replyCount: number };
