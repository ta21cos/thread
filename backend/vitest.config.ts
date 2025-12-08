import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations('./drizzle');

  return {
    test: {
      include: ['tests/integration/**/*.test.ts'],
      setupFiles: ['./tests/integration/setup.ts'],
      poolOptions: {
        workers: {
          wrangler: {
            configPath: './wrangler.toml',
            environment: 'development',
          },
          miniflare: {
            d1Persist: false,
            bindings: {
              TEST_MIGRATIONS: migrations,
            },
          },
        },
      },
    },
  };
});
