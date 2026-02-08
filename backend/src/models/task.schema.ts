import { sqliteTable, text, integer, index, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { notes } from './note.schema';
import { profiles } from './profile.schema';

// NOTE: Task schema for tracking TODO items extracted from notes
// Tasks are parsed from `- [ ]` syntax in note content
export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id')
      .notNull()
      .references((): AnySQLiteColumn => notes.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    position: integer('position').notNull(),
    isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_tasks_author_status').on(table.authorId, table.isCompleted),
    index('idx_tasks_note').on(table.noteId),
  ]
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
