import { drizzle } from 'drizzle-orm/bun-sqlite';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from '../../domain/models/note.schema';

export type BunDatabase = BunSQLiteDatabase<typeof schema>;

// NOTE: Raw SQLite instance for direct SQL queries (only available in Bun environment)
export let sqlite: Database | null = null;

// NOTE: Initialize Bun SQLite database for local development
export const initBunDatabase = (databaseUrl: string): BunDatabase => {
  sqlite = new Database(databaseUrl);
  return drizzle(sqlite, { schema });
};
