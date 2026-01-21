import { Database } from 'bun:sqlite';

// NOTE: Clean test database for E2E tests using direct SQL
const DATABASE_URL = 'data/test.db'; // process.env.DATABASE_URL;

function cleanDatabase() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('Cleaning test database...');

  const sqlite = new Database(DATABASE_URL);

  try {
    // NOTE: Delete in proper order - child tables first
    try {
      sqlite.run('DELETE FROM search_index');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    try {
      sqlite.run('DELETE FROM mentions');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    try {
      sqlite.run('DELETE FROM notes');
    } catch (e) {
      // Ignore if table doesn't exist
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
