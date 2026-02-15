-- Migration: Make author_id NOT NULL on notes table
--
-- Decision: SQLite does not support ALTER COLUMN, so we recreate the table.
-- Assumption: This is a single-user app; all orphaned notes are assigned to the first profile.
-- Strategy:
--   0. Guard: abort if NULL author_id exists but no profiles to backfill
--   1. Fill existing NULL author_id with the sole existing user
--   2. Recreate table with author_id NOT NULL
--   3. Copy data, drop old, rename new
--   4. Recreate indexes

-- Step 0: Guard - fail early if NULL author_id exists but no profiles to backfill.
-- Inserts into a NOT NULL column; if profiles is empty the subquery returns NULL → constraint error.
CREATE TABLE IF NOT EXISTS _migration_check (val TEXT NOT NULL);
--> statement-breakpoint
INSERT INTO _migration_check
  SELECT (SELECT id FROM profiles LIMIT 1)
  WHERE (SELECT COUNT(*) FROM notes WHERE author_id IS NULL) > 0;
--> statement-breakpoint
DROP TABLE IF EXISTS _migration_check;
--> statement-breakpoint

-- Step 1: Backfill NULL author_id with the first existing profile (single-user assumption)
UPDATE notes
SET author_id = (SELECT id FROM profiles LIMIT 1)
WHERE author_id IS NULL;
--> statement-breakpoint

-- Step 2: Create new table with author_id NOT NULL
-- NOTE: parent_id FK omits table name so it resolves correctly after RENAME
CREATE TABLE notes_new (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id TEXT,
  channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  depth INTEGER DEFAULT 0 NOT NULL,
  is_hidden INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint

-- Step 3: Copy all data from old table
INSERT INTO notes_new (id, content, author_id, parent_id, channel_id, created_at, updated_at, depth, is_hidden)
SELECT id, content, author_id, parent_id, channel_id, created_at, updated_at, depth, is_hidden
FROM notes;
--> statement-breakpoint

-- Step 4: Drop old table and rename new
DROP TABLE notes;
--> statement-breakpoint
ALTER TABLE notes_new RENAME TO notes;
--> statement-breakpoint

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notes_channel ON notes(channel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
