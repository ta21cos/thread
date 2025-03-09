import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './schema';

// Create a PostgreSQL connection pool
const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

// Create and export the Kysely database instance
export const db = new Kysely<Database>({
  dialect,
});
