import type { Database } from './types';

// NOTE: Database instance - set by environment-specific initialization
export let db: Database = null as unknown as Database;

// NOTE: Set database instance (used by both Bun and Workers environments)
export const setDb = (database: Database) => {
  db = database;
};

export * from '../../domain/models/note.schema';
export * from '../../domain/models/mention.schema';
export * from '../../domain/models/search.schema';
export * from '../../domain/models/profile.schema';
export * from '../../domain/models/external-identity.schema';
export type { Database } from './types';
