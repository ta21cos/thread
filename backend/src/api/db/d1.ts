import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../../domain/models/note.schema';

export type D1DrizzleDatabase = DrizzleD1Database<typeof schema>;

// NOTE: Initialize D1 database for Cloudflare Workers
export const initD1Database = (d1Binding: D1Database): D1DrizzleDatabase => {
  return drizzle(d1Binding, { schema });
};
