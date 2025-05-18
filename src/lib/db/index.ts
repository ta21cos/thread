import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './schema';
import { supabase } from '../supabase';

// Create a PostgreSQL connection pool using Supabase connection string
console.log('Connecting to PostgreSQL database...', process.env.DATABASE_URL);

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

// Create and export the Kysely database instance
export const db = new Kysely<Database>({
  dialect,
});

// Export Supabase storage for file uploads
export const storage = supabase.storage;
