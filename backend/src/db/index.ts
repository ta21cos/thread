import type { Database } from './types';

// NOTE: Database instance - set by environment-specific initialization
export let db: Database = null as unknown as Database;

// NOTE: Set database instance (used by both Bun and Workers environments)
export const setDb = (database: Database) => {
  db = database;
};

export * from '../models/channel.schema';
export * from '../models/note.schema';
export * from '../models/mention.schema';
export * from '../models/search.schema';
export * from '../models/profile.schema';
export * from '../models/external-identity.schema';
export * from '../models/bookmark.schema';
export * from '../models/task.schema';
export * from '../models/scratch-pad.schema';
export * from '../models/daily-note.schema';
export * from '../models/template.schema';
export type { Database } from './types';
