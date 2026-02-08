import { sqliteTable, text, integer, index, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profile.schema';

// NOTE: Channel schema for grouping notes
// Replaces isHidden with a more flexible channel-based organization
export const channels = sqliteTable(
  'channels',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('#6366f1'),
    icon: text('icon').default('hash'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('idx_channels_author_sort').on(table.authorId, table.sortOrder)]
);

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
