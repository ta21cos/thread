import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// NOTE: Application domain user profile separated from auth concerns
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  preferences: text('preferences', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
