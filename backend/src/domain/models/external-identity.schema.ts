import { sqliteTable, text, integer, unique, AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { profiles } from './profile.schema';

// NOTE: Provider-agnostic auth identity linking with support for CLERK and other OAuth providers
export const IDENTITY_PROVIDERS = ['CLERK', 'AUTH0', 'GOOGLE', 'GITHUB'] as const;
export type IdentityProvider = (typeof IDENTITY_PROVIDERS)[number];

export const externalIdentities = sqliteTable(
  'external_identities',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    profileId: text('profile_id')
      .notNull()
      .references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    email: text('email'),
    emailVerified: integer('email_verified', { mode: 'boolean' }),
    metadata: text('metadata', { mode: 'json' }),
    providerCreatedAt: integer('provider_created_at', { mode: 'timestamp' }),
    providerUpdatedAt: integer('provider_updated_at', { mode: 'timestamp' }),
    lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    uniqueProviderUser: unique().on(table.provider, table.providerUserId),
  })
);

export type ExternalIdentity = typeof externalIdentities.$inferSelect;
export type NewExternalIdentity = typeof externalIdentities.$inferInsert;
