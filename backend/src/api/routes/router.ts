import { Hono } from 'hono';
import { D1DrizzleDatabase } from '../db/types';
import { initD1Database } from '../db/d1';

export type Bindings = {
  DB: D1Database;
};

export type DbVariables = {
  db: D1DrizzleDatabase;
};

export function createRouter(): Hono<{ Bindings: Bindings; Variables: DbVariables }> {
  return new Hono<{ Bindings: Bindings }>().use('*', async (c, next) => {
    const db = initD1Database(c.env.DB);

    c.set('db', db);

    await next();
  });
}
