import { Database } from 'bun:sqlite';
import { Glob } from 'bun';
import path from 'path';

// NOTE: Find the D1 local database file dynamically
function findD1DatabasePath(): string {
  const wranglerDir = path.resolve(
    __dirname,
    '../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
  );
  const glob = new Glob('*.sqlite');
  const matches = Array.from(glob.scanSync({ cwd: wranglerDir }));

  if (matches.length === 0) {
    throw new Error(
      `No D1 database found in ${wranglerDir}. Run 'wrangler dev' first to initialize.`
    );
  }

  return path.join(wranglerDir, matches[0]);
}

// NOTE: Clean via direct SQLite access (not wrangler CLI) to avoid
// miniflare lock conflicts when wrangler dev is running concurrently
function cleanDatabase() {
  const dbPath = findD1DatabasePath();
  console.log(`Cleaning test database: ${dbPath}`);

  const sqlite = new Database(dbPath);

  try {
    // NOTE: Delete in proper order - child tables first (FK constraints)
    const tables = [
      'daily_notes',
      'tasks',
      'bookmarks',
      'scratch_pads',
      'templates',
      'search_index',
      'mentions',
      'notes',
      'channels',
    ];

    for (const table of tables) {
      try {
        sqlite.run(`DELETE FROM ${table}`);
      } catch {
        // Ignore if table doesn't exist
      }
    }

    console.log('✓ Test database cleaned');
    sqlite.close();
  } catch (error) {
    console.error('Error cleaning database:', error);
    sqlite.close();
    process.exit(1);
  }
}

// NOTE: Execute when run as a script
cleanDatabase();
