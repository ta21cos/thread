import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type * as schema from '../models/note.schema';

// NOTE: Bun SQLite database type for local development
export type BunDatabase = BunSQLiteDatabase<typeof schema>;

// NOTE: D1 database type for Cloudflare Workers
export type D1DrizzleDatabase = DrizzleD1Database<typeof schema>;

// NOTE: Union type supporting both Bun SQLite (dev) and D1 (production)
// Both database types now use the same Drizzle ORM API
export type Database = BunDatabase | D1DrizzleDatabase;
