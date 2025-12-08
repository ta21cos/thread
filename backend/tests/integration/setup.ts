import { env, applyD1Migrations } from 'cloudflare:test';
import { beforeAll } from 'vitest';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    TEST_MIGRATIONS: D1Migration[];
  }
}

// NOTE: Apply D1 migrations before running tests
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
