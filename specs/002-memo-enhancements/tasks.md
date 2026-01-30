# Implementation Tasks: Memo App Enhancements

**Feature Branch**: `002-memo-enhancements`
**Created**: 2026-01-30

## Overview

This document provides a step-by-step implementation guide for 5 features. Each task includes specific files to modify and acceptance criteria.

---

## Phase 1: Privacy Mode

### Task 1.1: Database Migration - Rename isHidden to isPrivate

**Files to modify:**
- `backend/src/models/note.schema.ts`
- `shared/types/index.ts`

**Steps:**
1. Create migration to rename column `is_hidden` → `is_private`
2. Update Note schema in Drizzle
3. Update shared types
4. Run migration

**Acceptance:** Notes table has `is_private` column instead of `is_hidden`

---

### Task 1.2: Create User Settings Table

**Files to create:**
- `backend/src/models/user-settings.schema.ts`

**Files to modify:**
- `backend/src/models/index.ts`

**Steps:**
1. Create UserSettings schema with fields:
   - `id` (TEXT PRIMARY KEY)
   - `privacy_pin` (TEXT, nullable, hashed)
   - `auto_lock_minutes` (INTEGER, default 5)
   - `default_mode` (TEXT, 'work' | 'private', default 'work')
   - `created_at`, `updated_at` (timestamps)
2. Export from models index
3. Run migration

**Acceptance:** user_settings table exists in database

---

### Task 1.3: Settings Service & Repository

**Files to create:**
- `backend/src/repositories/settings.repository.ts`
- `backend/src/services/settings/settings.service.ts`
- `backend/src/services/settings/types.ts`
- `backend/src/services/settings/index.ts`

**Steps:**
1. Create repository with CRUD operations
2. Create service with:
   - `getSettings()` - Get or create default settings
   - `updateSettings(data)` - Update settings
   - `setPin(pin)` - Hash and store PIN
   - `verifyPin(pin)` - Verify PIN
3. Use bcrypt for PIN hashing

**Acceptance:** Can get/set settings, set/verify PIN

---

### Task 1.4: Settings API Routes

**Files to create:**
- `backend/src/api/routes/settings.ts`

**Files to modify:**
- `backend/src/api/routes/index.ts`

**Steps:**
1. Create routes:
   - `GET /api/settings`
   - `PUT /api/settings`
   - `POST /api/settings/verify-pin`
2. Add validation middleware
3. Register routes in main router

**Acceptance:** API endpoints work correctly

---

### Task 1.5: Update Note Service for Privacy

**Files to modify:**
- `backend/src/services/note/note.service.ts`
- `backend/src/services/note/types.ts`
- `backend/src/api/routes/notes.ts`

**Steps:**
1. Rename `isHidden` → `isPrivate` in all service methods
2. Rename `updateHidden` → `updatePrivate`
3. Update API route path from `/hidden` to `/private`
4. Update query parameter from `includeHidden` to `includePrivate`

**Acceptance:** All tests pass with renamed fields

---

### Task 1.6: Frontend Settings Store

**Files to create:**
- `frontend/src/store/privacy.store.tsx`

**Files to modify:**
- `frontend/src/store/settings.store.tsx`

**Steps:**
1. Create privacy store with:
   - `mode: 'work' | 'private'`
   - `isLocked: boolean`
   - `toggleMode()` - Switches mode (prompts PIN if needed)
   - `lock()` - Lock private mode
   - `unlock(pin)` - Verify PIN and unlock
2. Migrate `showHiddenNotes` to use privacy mode
3. Add auto-lock timer

**Acceptance:** Privacy mode toggles correctly in UI

---

### Task 1.7: Privacy Mode UI Components

**Files to create:**
- `frontend/src/components/PrivacyBadge.tsx`
- `frontend/src/components/PinDialog.tsx`

**Files to modify:**
- `frontend/src/components/SettingsDropdown.tsx`
- `frontend/src/components/NoteList.tsx`
- `frontend/src/components/NoteEditor.tsx`

**Steps:**
1. Create PrivacyBadge showing current mode (Work/Private)
2. Create PinDialog for PIN entry
3. Update SettingsDropdown with privacy settings
4. Remove individual note "hidden" checkbox
5. Update NoteList to filter by privacy mode

**Acceptance:** Can toggle privacy mode via UI

---

### Task 1.8: Keyboard Shortcut for Privacy

**Files to create:**
- `frontend/src/hooks/useGlobalKeyboard.ts`

**Files to modify:**
- `frontend/src/App.tsx`

**Steps:**
1. Create global keyboard hook
2. Register `Cmd/Ctrl + Shift + L` for privacy toggle
3. Apply hook in App component

**Acceptance:** Keyboard shortcut toggles privacy mode

---

## Phase 2: Bookmarks

### Task 2.1: Bookmarks Database Table

**Files to create:**
- `backend/src/models/bookmark.schema.ts`

**Files to modify:**
- `backend/src/models/index.ts`

**Steps:**
1. Create bookmarks table schema:
   - `id` (TEXT PRIMARY KEY)
   - `note_id` (TEXT, UNIQUE, FK → notes)
   - `created_at` (timestamp)
2. Add index on note_id
3. Run migration

**Acceptance:** bookmarks table exists

---

### Task 2.2: Bookmark Service & Repository

**Files to create:**
- `backend/src/repositories/bookmark.repository.ts`
- `backend/src/services/bookmark/bookmark.service.ts`
- `backend/src/services/bookmark/index.ts`

**Steps:**
1. Create repository with:
   - `create(noteId)`
   - `delete(noteId)`
   - `findByNoteId(noteId)`
   - `findAll(includePrivate)`
2. Create service wrapping repository

**Acceptance:** Can add/remove bookmarks programmatically

---

### Task 2.3: Bookmark API Routes

**Files to create:**
- `backend/src/api/routes/bookmarks.ts`

**Files to modify:**
- `backend/src/api/routes/index.ts`
- `backend/src/api/routes/notes.ts` (add isBookmarked to responses)

**Steps:**
1. Create routes:
   - `GET /api/bookmarks`
   - `POST /api/bookmarks`
   - `DELETE /api/bookmarks/:noteId`
2. Modify note list query to include bookmark status
3. Register routes

**Acceptance:** Bookmark API endpoints work

---

### Task 2.4: Bookmarks Frontend Page

**Files to create:**
- `frontend/src/pages/BookmarksPage.tsx`
- `frontend/src/services/bookmark.service.ts`

**Files to modify:**
- `frontend/src/App.tsx` (add route)
- `frontend/src/components/Sidebar.tsx` (add nav item)

**Steps:**
1. Create bookmark service with API calls
2. Create BookmarksPage showing bookmarked notes
3. Add route `/bookmarks`
4. Add sidebar navigation

**Acceptance:** Can view bookmarks page with list of bookmarked notes

---

### Task 2.5: Bookmark Toggle in Note Components

**Files to modify:**
- `frontend/src/components/NoteList.tsx`
- `frontend/src/components/ThreadView.tsx`

**Steps:**
1. Add bookmark icon to note actions
2. Toggle bookmark on click
3. Show filled/outline icon based on status
4. Add keyboard shortcut `Cmd/Ctrl + D`

**Acceptance:** Can bookmark/unbookmark notes from UI

---

## Phase 3: TODO Tasks

### Task 3.1: Task Parsing Utility

**Files to create:**
- `backend/src/utils/task-parser.ts`
- `backend/src/utils/task-parser.spec.ts`

**Steps:**
1. Create function to parse tasks from markdown:
   ```typescript
   function parseTasks(content: string): Task[]
   function toggleTask(content: string, lineNumber: number): string
   ```
2. Handle checkbox syntax: `- [ ]` and `- [x]`
3. Write unit tests

**Acceptance:** Can parse and toggle tasks in markdown content

---

### Task 3.2: Tasks Service

**Files to create:**
- `backend/src/services/task/task.service.ts`
- `backend/src/services/task/types.ts`
- `backend/src/services/task/index.ts`

**Steps:**
1. Create service with:
   - `getAllTasks(includePrivate, completed?)` - Get all tasks across notes
   - `toggleTask(noteId, lineNumber)` - Toggle specific task
2. Use task parser utility
3. Query notes and parse content

**Acceptance:** Can list all tasks and toggle completion

---

### Task 3.3: Tasks API Routes

**Files to create:**
- `backend/src/api/routes/tasks.ts`

**Files to modify:**
- `backend/src/api/routes/index.ts`

**Steps:**
1. Create routes:
   - `GET /api/tasks`
   - `PATCH /api/tasks/:noteId/:lineNumber`
2. Register routes

**Acceptance:** Task API endpoints work

---

### Task 3.4: Tasks Frontend Page

**Files to create:**
- `frontend/src/pages/TasksPage.tsx`
- `frontend/src/services/task.service.ts`

**Files to modify:**
- `frontend/src/App.tsx` (add route)
- `frontend/src/components/Sidebar.tsx` (add nav item)

**Steps:**
1. Create task service with API calls
2. Create TasksPage showing all tasks
3. Group tasks by note
4. Add toggle functionality
5. Add route `/tasks`
6. Add sidebar navigation with count badge

**Acceptance:** Can view and manage tasks from dedicated page

---

### Task 3.5: Interactive Checkboxes in Notes

**Files to modify:**
- `frontend/src/components/NoteContent.tsx` (or markdown renderer)

**Steps:**
1. Render `- [ ]` as interactive checkbox
2. On click, call API to toggle and refetch note
3. Show visual feedback during update

**Acceptance:** Can toggle checkboxes inline in notes

---

## Phase 4: Quick Notes (Scratch Pad)

### Task 4.1: Scratch Pad Database Table

**Files to create:**
- `backend/src/models/scratch-pad.schema.ts`

**Files to modify:**
- `backend/src/models/index.ts`

**Steps:**
1. Create scratch_pads table:
   - `id` (TEXT PRIMARY KEY)
   - `content` (TEXT, default '')
   - `is_private` (INTEGER, default 0)
   - `updated_at` (timestamp)
2. Run migration

**Acceptance:** scratch_pads table exists

---

### Task 4.2: Scratch Pad Service & API

**Files to create:**
- `backend/src/services/scratch-pad/scratch-pad.service.ts`
- `backend/src/services/scratch-pad/index.ts`
- `backend/src/api/routes/scratch-pad.ts`

**Files to modify:**
- `backend/src/api/routes/index.ts`

**Steps:**
1. Create service with:
   - `get(isPrivate)` - Get or create scratch pad
   - `update(content, isPrivate)` - Update content
   - `toNote(isPrivate, clearAfter)` - Convert to note
2. Create API routes:
   - `GET /api/scratch-pad`
   - `PUT /api/scratch-pad`
   - `POST /api/scratch-pad/to-note`

**Acceptance:** Scratch pad CRUD works

---

### Task 4.3: Scratch Pad UI Component

**Files to create:**
- `frontend/src/components/ScratchPad.tsx`
- `frontend/src/store/scratch-pad.store.tsx`

**Files to modify:**
- `frontend/src/App.tsx`
- `frontend/src/components/Header.tsx`

**Steps:**
1. Create scratch pad store with content and visibility
2. Create slide-out panel component:
   - Text area with auto-save (debounced 2s)
   - "Create Note" button
   - "Clear" button
   - Save status indicator
3. Add toggle icon in header
4. Add keyboard shortcut `Cmd/Ctrl + .`

**Acceptance:** Can use scratch pad to capture quick notes

---

## Phase 5: Daily Notes

### Task 5.1: Templates Database Table

**Files to create:**
- `backend/src/models/template.schema.ts`

**Files to modify:**
- `backend/src/models/index.ts`

**Steps:**
1. Create templates table:
   - `id`, `name`, `content`, `type`, `is_default`, timestamps
2. Seed default daily template
3. Run migration

**Acceptance:** templates table exists with default daily template

---

### Task 5.2: Daily Notes Database Table

**Files to create:**
- `backend/src/models/daily-note.schema.ts`

**Files to modify:**
- `backend/src/models/index.ts`

**Steps:**
1. Create daily_notes table:
   - `id`, `date` (YYYY-MM-DD), `note_id` (FK), `is_private`, `created_at`
   - UNIQUE(date, is_private)
2. Add index on date
3. Run migration

**Acceptance:** daily_notes table exists

---

### Task 5.3: Template Service

**Files to create:**
- `backend/src/services/template/template.service.ts`
- `backend/src/services/template/index.ts`
- `backend/src/utils/template-renderer.ts`

**Steps:**
1. Create template service with CRUD
2. Create renderer for placeholders:
   - `{{date}}`, `{{date:format}}`, `{{weekday}}`
3. Use date-fns for formatting

**Acceptance:** Can render templates with placeholders

---

### Task 5.4: Daily Notes Service & API

**Files to create:**
- `backend/src/services/daily-note/daily-note.service.ts`
- `backend/src/services/daily-note/index.ts`
- `backend/src/api/routes/daily-notes.ts`
- `backend/src/api/routes/templates.ts`

**Files to modify:**
- `backend/src/api/routes/index.ts`

**Steps:**
1. Create daily note service:
   - `getOrCreate(date, isPrivate)` - Get or create daily note
   - `getCalendar(year, month, isPrivate)` - Get calendar entries
2. Create API routes:
   - `GET /api/daily-notes`
   - `POST /api/daily-notes`
   - `GET /api/daily-notes/calendar`
   - Template CRUD routes

**Acceptance:** Daily notes API works

---

### Task 5.5: Daily Notes Frontend Page

**Files to create:**
- `frontend/src/pages/DailyNotesPage.tsx`
- `frontend/src/components/Calendar.tsx`
- `frontend/src/services/daily-note.service.ts`

**Files to modify:**
- `frontend/src/App.tsx`
- `frontend/src/components/Sidebar.tsx`

**Steps:**
1. Create DailyNotesPage with:
   - Date picker header
   - Calendar widget showing entries
   - Note editor for daily content
2. Add routes `/daily` and `/daily/:date`
3. Add sidebar navigation
4. Add keyboard shortcuts

**Acceptance:** Can view and edit daily notes with calendar navigation

---

## Testing Summary

After each phase, run:
```bash
bun test                 # Unit tests
bun run test:e2e         # E2E tests
bun run typecheck        # Type checking
bun run lint             # Linting
```

---

## Completion Checklist

### Phase 1: Privacy Mode
- [ ] Task 1.1: Database migration
- [ ] Task 1.2: User settings table
- [ ] Task 1.3: Settings service
- [ ] Task 1.4: Settings API
- [ ] Task 1.5: Note service updates
- [ ] Task 1.6: Frontend privacy store
- [ ] Task 1.7: Privacy UI components
- [ ] Task 1.8: Keyboard shortcuts

### Phase 2: Bookmarks
- [ ] Task 2.1: Bookmarks table
- [ ] Task 2.2: Bookmark service
- [ ] Task 2.3: Bookmark API
- [ ] Task 2.4: Bookmarks page
- [ ] Task 2.5: Bookmark toggle UI

### Phase 3: TODO Tasks
- [ ] Task 3.1: Task parser utility
- [ ] Task 3.2: Tasks service
- [ ] Task 3.3: Tasks API
- [ ] Task 3.4: Tasks page
- [ ] Task 3.5: Interactive checkboxes

### Phase 4: Quick Notes
- [ ] Task 4.1: Scratch pad table
- [ ] Task 4.2: Scratch pad service & API
- [ ] Task 4.3: Scratch pad UI

### Phase 5: Daily Notes
- [ ] Task 5.1: Templates table
- [ ] Task 5.2: Daily notes table
- [ ] Task 5.3: Template service
- [ ] Task 5.4: Daily notes service & API
- [ ] Task 5.5: Daily notes page

---

_Each task is designed to be independently implementable and testable._
