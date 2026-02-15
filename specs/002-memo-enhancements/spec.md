# Feature Specification: Memo App Enhancements

**Feature Branch**: `002-memo-enhancements`
**Created**: 2026-01-30
**Status**: Ready for Implementation

## Overview

This specification defines 5 new features for the Thread memo application:

1. **Privacy Mode** - Migrate existing hidden notes to a comprehensive privacy system
2. **TODO List / Task Management** - Checkbox-based task tracking within notes
3. **Quick Notes (Scratch Pad)** - Free-form, non-threaded memo space
4. **Bookmarks** - Persist bookmark status for quick access to important notes
5. **Daily Notes** - Auto-generated journal entries by date

---

## Feature 1: Privacy Mode

### Background

The current `isHidden` field on notes provides basic visibility control. This feature evolves it into a comprehensive "Privacy Mode" with quick toggle and protection.

### User Stories

- As a user, I want to quickly hide all private notes with a keyboard shortcut so that I can protect my privacy when someone approaches
- As a user, I want private notes to require a PIN to view so that my personal information is protected
- As a user, I want a visual indicator showing which mode I'm in so that I don't accidentally create notes in the wrong context

### Acceptance Criteria

1. **Given** privacy mode is OFF, **When** user presses `Cmd/Ctrl + Shift + L`, **Then** all notes with `isPrivate: true` are hidden and the UI shows "Work Mode"
2. **Given** privacy mode is ON (Work Mode), **When** user presses `Cmd/Ctrl + Shift + L`, **Then** system prompts for PIN before revealing private notes
3. **Given** user enters correct PIN, **Then** private notes become visible and UI shows "Private Mode"
4. **Given** user is in Private Mode, **When** no activity for 5 minutes (configurable), **Then** system auto-locks to Work Mode
5. **Given** user creates a note in Private Mode, **Then** the note is automatically marked as private
6. **Given** user is viewing a private note, **When** switching to Work Mode, **Then** the view navigates away from the private note

### Data Model Changes

```typescript
// Rename isHidden → isPrivate (migration required)
interface Note {
  // ... existing fields
  isPrivate: boolean; // Renamed from isHidden
}

// New table: user_settings
interface UserSettings {
  id: string;
  privacyPin: string | null; // Hashed 4-6 digit PIN
  autoLockMinutes: number; // Default: 5
  defaultMode: 'work' | 'private'; // Default: 'work'
  createdAt: Date;
  updatedAt: Date;
}
```

### API Changes

```
# Existing endpoint (rename field in response)
PATCH /api/notes/:id/private     # Renamed from /hidden
  Body: { isPrivate: boolean }

# New endpoints
GET    /api/settings              # Get user settings
PUT    /api/settings              # Update settings
POST   /api/settings/verify-pin   # Verify PIN for unlock
  Body: { pin: string }
  Response: { valid: boolean }
```

### UI Changes

1. **Header Indicator**
   - Show current mode badge: "Work Mode" (blue) or "Private Mode" (purple)
   - Click badge to toggle (requires PIN for private)

2. **Settings Panel**
   - Set/change privacy PIN
   - Configure auto-lock timeout (1, 5, 10, 30 minutes, or never)
   - Set default startup mode

3. **Keyboard Shortcuts**
   - `Cmd/Ctrl + Shift + L`: Toggle privacy mode (panic button)
   - Should work globally, even when input is focused

4. **Note Editor**
   - Remove individual "hidden" checkbox
   - Notes inherit privacy from current mode
   - Option to manually toggle note privacy via context menu

### Migration Steps

1. Rename `is_hidden` column to `is_private` in notes table
2. Create `user_settings` table
3. Update all API endpoints and services
4. Update frontend components

---

## Feature 2: TODO List / Task Management

### Background

Enable task tracking within notes using checkbox markdown syntax (`- [ ]` and `- [x]`), with a dedicated view to see all tasks across notes.

### User Stories

- As a user, I want to create checkboxes in notes using markdown so that I can track tasks inline
- As a user, I want to click checkboxes to toggle completion so that task management is seamless
- As a user, I want a dedicated TODO view showing all incomplete tasks so that I can see what needs to be done

### Acceptance Criteria

1. **Given** user types `- [ ] Task text`, **Then** it renders as an interactive checkbox
2. **Given** user clicks an unchecked checkbox, **Then** it becomes checked and updates the note content to `- [x]`
3. **Given** user opens TODO view, **Then** they see all unchecked tasks grouped by note
4. **Given** user checks a task in TODO view, **Then** the original note is updated
5. **Given** user clicks on a task in TODO view, **Then** they navigate to that note
6. **Given** a note contains tasks, **Then** the note list shows a task count badge (e.g., "2/5")
7. **Given** privacy mode is ON (Work Mode), **Then** TODO view only shows tasks from non-private notes

### Data Model

No new tables required. Tasks are parsed from note content at runtime.

```typescript
// Parsed task structure (not stored, computed)
interface Task {
  noteId: string;
  lineNumber: number;
  text: string;
  completed: boolean;
  createdAt: Date; // Note's createdAt
}

// API response type
interface TaskListResponse {
  tasks: Array<{
    noteId: string;
    notePreview: string; // First 50 chars of note
    lineNumber: number;
    text: string;
    completed: boolean;
    createdAt: string;
  }>;
  total: number;
  completedCount: number;
}
```

### API Endpoints

```
GET /api/tasks
  Query: {
    completed?: boolean,      # Filter by status
    includePrivate?: boolean  # Include private notes' tasks
  }
  Response: TaskListResponse

PATCH /api/tasks/:noteId/:lineNumber
  Body: { completed: boolean }
  Response: { success: boolean, note: Note }
```

### UI Changes

1. **Sidebar Navigation**
   - Add "Tasks" menu item with pending count badge
   - Icon: CheckSquare

2. **TODO View Page** (`/tasks`)
   - List all incomplete tasks, grouped by note
   - Each task shows: checkbox, task text, note preview, relative time
   - Click task text → navigate to note
   - Click checkbox → toggle completion
   - Filter: All / Today / Overdue (if due dates added later)

3. **Note Renderer**
   - Render `- [ ]` as interactive checkbox
   - Render `- [x]` as checked checkbox
   - Clicking checkbox updates note content

4. **Note List Item**
   - Show task badge: "2/5 tasks" or checkmark if all complete

### Implementation Notes

- Parse checkbox syntax with regex: `/^(\s*)- \[([ xX])\] (.+)$/gm`
- When toggling, replace `[ ]` with `[x]` or vice versa at exact position
- Update search index when task status changes

---

## Feature 3: Quick Notes (Scratch Pad)

### Background

Provide a free-form scratch pad for quick notes that don't fit the thread structure. One persistent scratch pad that's always accessible.

### User Stories

- As a user, I want a scratch pad for quick thoughts so that I can capture ideas without creating formal notes
- As a user, I want the scratch pad to auto-save so that I don't lose my work
- As a user, I want to convert scratch pad content to a note so that I can formalize important ideas

### Acceptance Criteria

1. **Given** user clicks scratch pad icon, **Then** a slide-out panel or modal opens with a text area
2. **Given** user types in scratch pad, **Then** content is auto-saved every 2 seconds
3. **Given** user has content in scratch pad, **When** they click "Create Note", **Then** a new note is created with that content
4. **Given** scratch pad has content, **Then** the icon shows a dot indicator
5. **Given** user closes and reopens the app, **Then** scratch pad content persists
6. **Given** user creates a note from scratch pad, **Then** scratch pad is optionally cleared
7. **Given** privacy mode is ON (Work Mode), **Then** private scratch pad is hidden; work scratch pad is shown

### Data Model

```typescript
// New table: scratch_pads
interface ScratchPad {
  id: string; // Primary key
  content: string; // Markdown content (no length limit, but recommend soft limit of 10000)
  isPrivate: boolean; // Which mode this scratch pad belongs to
  updatedAt: Date;
}
```

### API Endpoints

```
GET /api/scratch-pad
  Query: { isPrivate?: boolean }
  Response: { content: string, updatedAt: string }

PUT /api/scratch-pad
  Body: { content: string, isPrivate?: boolean }
  Response: { success: boolean, updatedAt: string }

POST /api/scratch-pad/to-note
  Body: { clearAfter?: boolean }
  Response: { note: Note }
```

### UI Changes

1. **Header Icon**
   - Scratch pad icon (Notebook or FileText) in header
   - Dot indicator when content exists

2. **Scratch Pad Panel**
   - Slide-out panel from right side (or bottom on mobile)
   - Full-height text area with markdown preview toggle
   - Character count display
   - "Create Note" button
   - "Clear" button with confirmation
   - Auto-save indicator ("Saved" / "Saving...")

3. **Keyboard Shortcut**
   - `Cmd/Ctrl + .` to toggle scratch pad

---

## Feature 4: Bookmarks

### Background

The UI already has bookmark functionality in dropdown menus, but it's not persisted. This feature adds database persistence for bookmarks.

### User Stories

- As a user, I want to bookmark important notes so that I can quickly find them later
- As a user, I want a bookmarks view showing all my bookmarked notes so that I can access them easily
- As a user, I want bookmarks to persist across sessions so that I don't lose my organization

### Acceptance Criteria

1. **Given** user clicks bookmark on a note, **Then** the note is marked as bookmarked and icon fills in
2. **Given** user has bookmarked notes, **When** they open bookmarks view, **Then** they see all bookmarked notes
3. **Given** user bookmarks a note, **Then** the bookmark persists after app restart
4. **Given** user clicks bookmark again, **Then** the bookmark is removed
5. **Given** privacy mode is ON (Work Mode), **Then** bookmarks view only shows non-private bookmarked notes
6. **Given** user is on bookmarks view, **When** they click a note, **Then** they navigate to that note's thread

### Data Model

```typescript
// New table: bookmarks
interface Bookmark {
  id: string;
  noteId: string; // References notes.id
  createdAt: Date;
}

// Add to notes join
interface NoteWithBookmark extends Note {
  isBookmarked: boolean;
}
```

### API Endpoints

```
GET /api/bookmarks
  Query: { includePrivate?: boolean }
  Response: { notes: Note[], total: number }

POST /api/bookmarks
  Body: { noteId: string }
  Response: { success: boolean }

DELETE /api/bookmarks/:noteId
  Response: { success: boolean }

# Modify existing note endpoints to include bookmark status
GET /api/notes
  Response: { notes: NoteWithBookmark[], ... }
```

### UI Changes

1. **Sidebar Navigation**
   - Add "Bookmarks" menu item with count badge
   - Icon: Bookmark

2. **Bookmarks View Page** (`/bookmarks`)
   - Grid or list of bookmarked notes
   - Click to navigate to note
   - Sort by bookmark date (newest first)

3. **Note List / Thread View**
   - Bookmark icon in note actions
   - Filled when bookmarked, outlined when not

4. **Keyboard Shortcut**
   - `Cmd/Ctrl + D` to toggle bookmark on selected note

---

## Feature 5: Daily Notes

### Background

Auto-generated daily journal entries that serve as a consistent place to capture thoughts for each day.

### User Stories

- As a user, I want a daily note auto-created for today so that I have a consistent journaling practice
- As a user, I want to access past daily notes through a calendar so that I can review my history
- As a user, I want daily notes to use a template so that I have a consistent structure

### Acceptance Criteria

1. **Given** user opens daily notes, **Then** today's note is displayed (created if doesn't exist)
2. **Given** today's note doesn't exist, **When** user opens daily notes, **Then** a new note is created with the configured template
3. **Given** user views daily notes, **Then** they see a calendar/date picker for navigation
4. **Given** user clicks a past date, **Then** they see that day's note (or "No entry" message)
5. **Given** user is in Private Mode, **Then** daily notes are created as private
6. **Given** user has a daily note template configured, **Then** new daily notes use that template
7. **Given** user edits a daily note, **Then** it saves like a regular note

### Data Model

```typescript
// New table: daily_notes (mapping table)
interface DailyNote {
  id: string;
  date: string; // YYYY-MM-DD format
  noteId: string; // References notes.id
  isPrivate: boolean;
  createdAt: Date;
}

// New table: templates
interface Template {
  id: string;
  name: string;
  content: string; // Markdown with placeholders
  type: 'daily' | 'general';
  isDefault: boolean; // Is this the default for its type?
  createdAt: Date;
  updatedAt: Date;
}
```

**Template Placeholders**:

- `{{date}}` - Current date (YYYY-MM-DD)
- `{{date:format}}` - Formatted date (e.g., `{{date:MMMM D, YYYY}}`)
- `{{weekday}}` - Day of week (Monday, Tuesday, etc.)

**Default Daily Template**:

```markdown
# {{date:MMMM D, YYYY}} ({{weekday}})

## Today's Focus

## Notes

## Tasks

- [ ]
```

### API Endpoints

```
# Daily Notes
GET /api/daily-notes
  Query: { date?: string, includePrivate?: boolean }
  Response: {
    note: Note | null,
    date: string,
    hasEntry: boolean
  }

POST /api/daily-notes
  Body: { date?: string }  # Defaults to today
  Response: { note: Note }

GET /api/daily-notes/calendar
  Query: {
    year: number,
    month: number,
    includePrivate?: boolean
  }
  Response: {
    entries: Array<{ date: string, noteId: string, preview: string }>
  }

# Templates
GET /api/templates
  Response: { templates: Template[] }

POST /api/templates
  Body: { name: string, content: string, type: string }
  Response: { template: Template }

PUT /api/templates/:id
  Body: { name?: string, content?: string, isDefault?: boolean }
  Response: { template: Template }

DELETE /api/templates/:id
  Response: { success: boolean }
```

### UI Changes

1. **Sidebar Navigation**
   - Add "Daily" menu item
   - Icon: Calendar

2. **Daily Notes Page** (`/daily`)
   - Header with date picker
   - Previous/Next day navigation arrows
   - Calendar widget for month overview
   - Days with entries marked with dot
   - Main content area shows the daily note (editable)
   - "No entry for this day" with "Create Entry" button for past dates

3. **Daily Note Editor**
   - Same as regular note editor
   - Auto-saves like regular notes
   - Shows date prominently

4. **Settings Panel**
   - Daily note template editor
   - Default privacy setting for daily notes

5. **Keyboard Shortcuts**
   - `Cmd/Ctrl + T` to open today's daily note
   - `Cmd/Ctrl + [` / `Cmd/Ctrl + ]` for previous/next day

---

## Implementation Order

### Phase 1: Foundation (Priority: Critical)

1. **Privacy Mode** - Foundation for all other features
   - Rename `isHidden` → `isPrivate`
   - Implement PIN protection
   - Add keyboard shortcut
   - Create settings table and API

### Phase 2: Core Features (Priority: High)

2. **Bookmarks** - Simple, builds on existing UI
   - Create bookmarks table
   - Implement API endpoints
   - Add bookmark view

3. **TODO Tasks** - High user value
   - Implement task parsing
   - Create tasks view
   - Add interactive checkboxes

### Phase 3: Extended Features (Priority: Medium)

4. **Quick Notes** - Independent feature
   - Create scratch_pads table
   - Implement panel UI
   - Add auto-save

5. **Daily Notes** - Depends on templates
   - Create tables
   - Implement calendar view
   - Template system

---

## Database Migration Summary

```sql
-- Phase 1: Privacy Mode
ALTER TABLE notes RENAME COLUMN is_hidden TO is_private;

CREATE TABLE user_settings (
  id TEXT PRIMARY KEY,
  privacy_pin TEXT,
  auto_lock_minutes INTEGER NOT NULL DEFAULT 5,
  default_mode TEXT NOT NULL DEFAULT 'work',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Phase 2: Bookmarks
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(note_id)
);
CREATE INDEX idx_bookmarks_note ON bookmarks(note_id);

-- Phase 3: Quick Notes
CREATE TABLE scratch_pads (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  is_private INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Phase 4: Daily Notes & Templates
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE daily_notes (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  is_private INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(date, is_private)
);
CREATE INDEX idx_daily_notes_date ON daily_notes(date);
```

---

## Shared Types Update

```typescript
// shared/types/index.ts additions

export interface UserSettings {
  id: string;
  privacyPin: string | null;
  autoLockMinutes: number;
  defaultMode: 'work' | 'private';
}

export interface Task {
  noteId: string;
  notePreview: string;
  lineNumber: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface ScratchPad {
  content: string;
  isPrivate: boolean;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  noteId: string;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  date: string;
  noteId: string;
  isPrivate: boolean;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  type: 'daily' | 'general';
  isDefault: boolean;
}

// Update Note interface
export interface Note {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  depth: number;
  isPrivate: boolean; // Renamed from isHidden
  isBookmarked?: boolean; // Optional, included when queried
  taskCount?: { completed: number; total: number }; // Optional
}
```

---

## Frontend Route Updates

```typescript
// Add new routes
const routes = [
  { path: '/', element: <NotesPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/bookmarks', element: <BookmarksPage /> },
  { path: '/daily', element: <DailyNotesPage /> },
  { path: '/daily/:date', element: <DailyNotesPage /> },
  { path: '/settings', element: <SettingsPage /> },
];
```

---

## Keyboard Shortcuts Summary

| Shortcut               | Action                             |
| ---------------------- | ---------------------------------- |
| `Cmd/Ctrl + Shift + L` | Toggle Privacy Mode (Panic Button) |
| `Cmd/Ctrl + .`         | Toggle Scratch Pad                 |
| `Cmd/Ctrl + D`         | Toggle Bookmark on selected note   |
| `Cmd/Ctrl + T`         | Open today's Daily Note            |
| `Cmd/Ctrl + [`         | Previous day (in Daily Notes)      |
| `Cmd/Ctrl + ]`         | Next day (in Daily Notes)          |

---

## Testing Requirements

### Unit Tests

- Privacy PIN hashing and verification
- Task parsing from markdown
- Template placeholder replacement
- Date formatting utilities

### Integration Tests

- Privacy mode toggle with PIN
- Task completion updates note content
- Bookmark create/delete persistence
- Daily note creation with template

### E2E Tests

- Panic button workflow (private → work mode)
- Create task, check in TODO view, verify note updated
- Bookmark note, refresh, verify persisted
- Open daily notes, navigate calendar, edit entry

---

## Security Considerations

1. **Privacy PIN**
   - Hash PIN with bcrypt before storage
   - Rate limit PIN attempts (5 per minute)
   - No PIN recovery (must reset)

2. **Privacy Mode**
   - Clear any cached private note content when switching to Work Mode
   - Ensure private notes not leaked in search results

3. **Input Validation**
   - Sanitize all template content
   - Validate date formats strictly

---

_This specification provides complete implementation details for AI-assisted development._
