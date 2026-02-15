import { sqliteTable, text, integer, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profile.schema';

// NOTE: Template schema for daily note templates
// Templates can contain placeholders like {{date}}, {{weekday}}, etc.
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  authorId: text('author_id')
    .notNull()
    .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
