import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { setDb } from '../src/api/db';
import * as schema from '../src/api/db';

// NOTE: Preload script for Bun test runner to initialize database
const DATABASE_URL = process.env.DATABASE_URL || 'data/test.db';
const sqlite = new Database(DATABASE_URL);

// NOTE: Enable foreign key constraints for SQLite
sqlite.exec('PRAGMA foreign_keys = ON');

const database = drizzle(sqlite, { schema });
setDb(database);

console.log('✓ Test database initialized:', DATABASE_URL);
