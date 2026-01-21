import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { notes } from './note.schema';

// NOTE: Drizzle schema for Mention entity with circular reference prevention
export const mentions = sqliteTable(
  'mentions',
  {
    id: text('id').primaryKey(),
    fromNoteId: text('from_note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    toNoteId: text('to_note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueMention: unique().on(table.fromNoteId, table.toNoteId, table.position),
  })
);

export type Mention = typeof mentions.$inferSelect;
export type NewMention = typeof mentions.$inferInsert;
