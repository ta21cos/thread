-- Migration: Make channel_id NOT NULL on notes and scratch_pads tables
--
-- Decision: SQLite does not support ALTER COLUMN, so we recreate the tables.
-- Strategy:
--   0. Guard: abort if NULL channel_id exists but no channels to backfill
--   1. Backfill NULL channel_id with the author's first channel (by sort_order)
--   2. Recreate notes table with channel_id NOT NULL + ON DELETE RESTRICT
--   3. Recreate scratch_pads table with channel_id NOT NULL + ON DELETE RESTRICT
--   4. Copy data, drop old, rename new
--   5. Recreate indexes and constraints

-- Step 0: Guard - fail early if NULL channel_id exists but no channels to backfill.
CREATE TABLE IF NOT EXISTS _migration_check (val TEXT NOT NULL);
--> statement-breakpoint
INSERT INTO _migration_check
  SELECT (SELECT id FROM channels LIMIT 1)
  WHERE (SELECT COUNT(*) FROM notes WHERE channel_id IS NULL) > 0;
--> statement-breakpoint
DROP TABLE IF EXISTS _migration_check;
--> statement-breakpoint

-- Step 1a: Backfill NULL channel_id on notes with author's first channel
UPDATE notes
SET channel_id = (
  SELECT id FROM channels
  WHERE channels.author_id = notes.author_id
  ORDER BY sort_order ASC
  LIMIT 1
)
WHERE channel_id IS NULL;
--> statement-breakpoint

-- Step 1b: Backfill NULL channel_id on scratch_pads with author's first channel
UPDATE scratch_pads
SET channel_id = (
  SELECT id FROM channels
  WHERE channels.author_id = scratch_pads.author_id
  ORDER BY sort_order ASC
  LIMIT 1
)
WHERE channel_id IS NULL;
--> statement-breakpoint

-- Step 2: Create new notes table with channel_id NOT NULL
CREATE TABLE notes_new (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id TEXT,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  depth INTEGER DEFAULT 0 NOT NULL,
  is_hidden INTEGER DEFAULT 0 NOT NULL
);
--> statement-breakpoint

-- Step 3: Copy all data from old notes table
INSERT INTO notes_new (id, content, author_id, parent_id, channel_id, created_at, updated_at, depth, is_hidden)
SELECT id, content, author_id, parent_id, channel_id, created_at, updated_at, depth, is_hidden
FROM notes;
--> statement-breakpoint

-- Step 4: Drop old notes table and rename new
DROP TABLE notes;
--> statement-breakpoint
ALTER TABLE notes_new RENAME TO notes;
--> statement-breakpoint

-- Step 5: Recreate indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_channel ON notes(channel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
--> statement-breakpoint

-- Step 6: Create new scratch_pads table with channel_id NOT NULL
CREATE TABLE scratch_pads_new (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(author_id, channel_id)
);
--> statement-breakpoint

-- Step 7: Copy all data from old scratch_pads table
INSERT INTO scratch_pads_new (id, author_id, channel_id, content, updated_at)
SELECT id, author_id, channel_id, content, updated_at
FROM scratch_pads;
--> statement-breakpoint

-- Step 8: Drop old scratch_pads table and rename new
DROP TABLE scratch_pads;
--> statement-breakpoint
ALTER TABLE scratch_pads_new RENAME TO scratch_pads;
