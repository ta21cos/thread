-- Add channels table for grouping notes
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT DEFAULT 'hash',
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_channels_author_sort ON channels(author_id, sort_order);

-- Add channel_id to notes table
ALTER TABLE notes ADD COLUMN channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notes_channel ON notes(channel_id);

-- Add bookmarks table for marking important notes
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(note_id, author_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_author ON bookmarks(author_id);

-- Add tasks table for tracking TODO items
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_completed INTEGER DEFAULT 0 NOT NULL,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_author_status ON tasks(author_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_note ON tasks(note_id);

-- Add scratch_pads table for quick notes
CREATE TABLE IF NOT EXISTS scratch_pads (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id TEXT REFERENCES channels(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(author_id, channel_id)
);

-- Add daily_notes table for diary feature
CREATE TABLE IF NOT EXISTS daily_notes (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  UNIQUE(author_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_notes_date ON daily_notes(date);

-- Add templates table for daily note templates
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
