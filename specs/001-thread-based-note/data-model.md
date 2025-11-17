# Data Model Specification

**Feature**: Thread-Based Note-Taking Application  
**Date**: 2025-09-07  
**Version**: 1.0.0

## Entity Definitions

### Note

Primary entity representing a single note in the system.

```typescript
interface Note {
  id: string; // Unique 6-char ID (e.g., "a3k7m9")
  content: string; // Markdown text content (max 1000 chars)
  parentId?: string; // Reference to parent note (null for root notes)
  createdAt: Date; // ISO 8601 timestamp
  updatedAt: Date; // ISO 8601 timestamp
  depth: number; // Thread depth (0 for root notes)
}
```

**Validation Rules**:

- `id`: Required, unique, 6 characters alphanumeric
- `content`: Required, 1-1000 characters, valid markdown
- `parentId`: Optional, must reference existing note if provided
- `createdAt`: Required, immutable after creation
- `updatedAt`: Required, updates on any change
- `depth`: Required, 0-100 (max thread depth)

**Indexes**:

- Primary: `id`
- Secondary: `parentId`, `createdAt DESC`, `updatedAt DESC`

### Mention

Represents a reference from one note to another using @ID syntax.

```typescript
interface Mention {
  id: string; // Unique identifier
  fromNoteId: string; // Note containing the mention
  toNoteId: string; // Note being mentioned
  position: number; // Character position in content
  createdAt: Date; // When mention was created
}
```

**Validation Rules**:

- `fromNoteId`: Required, must reference existing note
- `toNoteId`: Required, must reference existing note
- `position`: Required, >= 0, < content length
- Unique constraint on (`fromNoteId`, `toNoteId`, `position`)

**Indexes**:

- Primary: `id`
- Secondary: `fromNoteId`, `toNoteId`

### SearchIndex

Full-text search index for note content.

```typescript
interface SearchIndex {
  noteId: string; // Reference to note
  content: string; // Preprocessed searchable text
  tokens: string[]; // Tokenized content for search
  mentions: string[]; // Extracted mention IDs
  updatedAt: Date; // Last index update
}
```

**Validation Rules**:

- `noteId`: Required, unique, references existing note
- `content`: Required, lowercase, no markdown syntax
- `tokens`: Required, array of stemmed words
- `mentions`: Array of valid note IDs

**Indexes**:

- Primary: `noteId`
- Full-text: `content`, `tokens`

## Relationships

### Parent-Child (Thread Structure)

- **Type**: One-to-Many
- **Parent**: Note (via `parentId`)
- **Children**: Note[] (where `parentId = note.id`)
- **Cascade**: Delete parent → delete all children
- **Constraints**: No circular references

### Mention Network

- **Type**: Many-to-Many
- **From**: Note (via `Mention.fromNoteId`)
- **To**: Note (via `Mention.toNoteId`)
- **Cascade**: Delete note → delete related mentions
- **Constraints**: No self-mentions

## State Transitions

### Note Lifecycle

```
DRAFT → SAVED → EDITED → DELETED
         ↑         ↓
         ←---------
```

**Transitions**:

1. **Create**: `null → DRAFT → SAVED`
   - Validate content length
   - Generate unique ID
   - Set timestamps
   - Extract mentions

2. **Edit**: `SAVED → EDITED → SAVED`
   - Validate content changes
   - Update `updatedAt`
   - Re-index for search
   - Update mention references

3. **Delete**: `SAVED → DELETED`
   - Cascade delete children
   - Remove from search index
   - Clean up mentions
   - Soft delete with timestamp

## Data Integrity Rules

### Thread Integrity

- Maximum depth: 100 levels
- Circular reference prevention
- Orphan prevention (parentId must exist)
- Root note cannot have parentId

### Content Integrity

- No empty content
- Maximum size: 1000 characters per note
- Valid UTF-8 encoding
- Sanitized markdown (no scripts)

### Referential Integrity

- Foreign key constraints on all IDs
- Cascade deletes for child notes
- Mention cleanup on note deletion
- Search index synchronization

## Query Patterns

### Common Queries

```sql
-- Get thread by root note
WITH RECURSIVE thread AS (
  SELECT * FROM notes WHERE id = ?
  UNION ALL
  SELECT n.* FROM notes n
  JOIN thread t ON n.parentId = t.id
)
SELECT * FROM thread ORDER BY depth, createdAt;

-- Find mentions of a note
SELECT n.* FROM notes n
JOIN mentions m ON n.id = m.fromNoteId
WHERE m.toNoteId = ?;

-- Search notes by content
SELECT * FROM notes
WHERE id IN (
  SELECT noteId FROM search_index
  WHERE content MATCH ?
)
ORDER BY updatedAt DESC;

-- Get recent notes (for list view)
SELECT * FROM notes
WHERE parentId IS NULL
ORDER BY createdAt DESC
LIMIT ? OFFSET ?;
```

## Migration Strategy

### Drizzle ORM Schema Definition

The following SQL will be managed through Drizzle ORM migrations for type safety and version control.

### Version 1.0.0 Schema

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 1000),
  parentId TEXT REFERENCES notes(id) ON DELETE CASCADE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  depth INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE mentions (
  id TEXT PRIMARY KEY,
  fromNoteId TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  toNoteId TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fromNoteId, toNoteId, position)
);

CREATE TABLE search_index (
  noteId TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tokens TEXT NOT NULL,
  mentions TEXT,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_notes_parent ON notes(parentId);
CREATE INDEX idx_notes_created ON notes(createdAt DESC);
CREATE INDEX idx_mentions_from ON mentions(fromNoteId);
CREATE INDEX idx_mentions_to ON mentions(toNoteId);
CREATE INDEX idx_search_content ON search_index(content);
```

## Performance Considerations

### Optimizations

- Denormalized `depth` field for fast thread queries
- Separate search index table for full-text search
- Composite indexes for common query patterns
- Pagination for large result sets

### Caching Strategy

- LRU cache for recent notes (100 items)
- Thread cache for expanded threads (10 threads)
- Search result cache (5 minutes TTL)
- Mention graph cache (on first load)

---

_This data model supports all functional requirements while maintaining simplicity and performance._
