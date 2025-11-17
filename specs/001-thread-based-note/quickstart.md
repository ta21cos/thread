# Quickstart Guide & Test Scenarios

**Feature**: Thread-Based Note-Taking Application  
**Date**: 2025-09-07  
**Purpose**: Validation scenarios for acceptance testing

## Setup Instructions

### Prerequisites

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Setup database
bun run db:setup

# Start development server
bun run dev
```

### Environment Variables

```bash
# .env.local
DATABASE_URL=sqlite://./data/notes.db
PORT=3000
NODE_ENV=development
```

## Test Scenarios

### Scenario 1: Create First Note

**User Story**: As a new user, I want to create my first note

**Steps**:

1. Open application (http://localhost:3000)
2. Click "New Note" button
3. Type "My first note about #productivity"
4. Click "Save"

**Expected Results**:

- ✅ Note appears in left panel list
- ✅ Note shows unique ID (e.g., "a3k7m9")
- ✅ Timestamp shows current time
- ✅ #productivity is highlighted as a tag

**Validation Command**:

```bash
curl http://localhost:3000/api/notes | jq '.notes[0]'
```

### Scenario 2: Create Thread Reply

**User Story**: I want to reply to an existing note to create a thread

**Steps**:

1. Click on existing note in list
2. Click "Reply" button in right panel
3. Type "This is a reply to the original thought"
4. Click "Save"

**Expected Results**:

- ✅ Reply appears nested under parent note
- ✅ Thread view shows hierarchy
- ✅ Parent note shows reply count (1)
- ✅ Reply has depth indicator

**Validation Command**:

```bash
curl http://localhost:3000/api/notes/{parent_id}?includeThread=true | jq '.thread'
```

### Scenario 3: Mention Another Note

**User Story**: I want to reference another note using mentions

**Steps**:

1. Create new note
2. Type "@" and paste a note ID
3. Complete note: "Following up on @a3k7m9"
4. Save note

**Expected Results**:

- ✅ Mention is highlighted/linked
- ✅ Clicking mention navigates to referenced note
- ✅ Referenced note shows "Mentioned by" indicator
- ✅ Mention survives page refresh

**Validation Command**:

```bash
curl http://localhost:3000/api/notes/a3k7m9/mentions | jq '.mentions'
```

### Scenario 4: Search by Content

**User Story**: I want to find notes by searching their content

**Steps**:

1. Create multiple notes with various content
2. Click search icon or press Ctrl+F
3. Type "productivity"
4. Press Enter

**Expected Results**:

- ✅ Search results show matching notes
- ✅ Search term is highlighted in results
- ✅ Results update as you type (debounced)
- ✅ Empty results for non-existent terms

**Validation Command**:

```bash
curl "http://localhost:3000/api/notes/search?q=productivity" | jq '.results'
```

### Scenario 5: Navigate Thread Hierarchy

**User Story**: I want to explore nested thread conversations

**Steps**:

1. Create root note
2. Add 3 levels of replies
3. Click on root note
4. Expand thread in right panel

**Expected Results**:

- ✅ All replies visible in hierarchy
- ✅ Indentation shows depth
- ✅ Each level maintains context
- ✅ Collapse/expand works at each level

### Scenario 6: Edit Existing Note

**User Story**: I want to update the content of my note

**Steps**:

1. Click on existing note
2. Click "Edit" button
3. Modify content
4. Save changes

**Expected Results**:

- ✅ Updated content appears immediately
- ✅ Updated timestamp changes
- ✅ Mentions remain intact
- ✅ Thread position unchanged

**Validation Command**:

```bash
curl -X PUT http://localhost:3000/api/notes/{id} \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated content"}' | jq '.updatedAt'
```

### Scenario 7: Delete Note with Replies

**User Story**: I want to delete a note and its entire thread

**Steps**:

1. Select note with replies
2. Click "Delete" button
3. Confirm deletion dialog
4. Click "Delete All"

**Expected Results**:

- ✅ Parent note removed from list
- ✅ All replies deleted (cascade)
- ✅ Mentions to deleted notes show as invalid
- ✅ Cannot recover deleted thread

**Validation Command**:

```bash
curl -X DELETE http://localhost:3000/api/notes/{id}
# Should return 204 No Content
curl http://localhost:3000/api/notes/{id}
# Should return 404 Not Found
```

### Scenario 8: Handle Circular References

**User Story**: System should handle circular mentions gracefully

**Steps**:

1. Create Note A with ID "abc123"
2. Create Note B mentioning @abc123
3. Edit Note A to mention Note B's ID
4. Navigate between mentions

**Expected Results**:

- ✅ Both mentions work
- ✅ No infinite loops
- ✅ Navigation history maintained
- ✅ Back button works correctly

### Scenario 9: Test Long Thread Performance

**User Story**: System should handle very long threads

**Steps**:

1. Create root note
2. Add 50+ replies in sequence
3. Scroll through thread
4. Search within thread

**Expected Results**:

- ✅ Smooth scrolling (virtual scroll)
- ✅ No performance degradation
- ✅ Search remains fast
- ✅ Memory usage stable

### Scenario 10: Test Note Length Limit

**User Story**: System should enforce note size limits

**Steps**:

1. Create new note
2. Paste 11KB of text
3. Attempt to save

**Expected Results**:

- ✅ Error message appears
- ✅ Character counter shows limit
- ✅ Note not saved
- ✅ User can edit to reduce size

## Performance Benchmarks

### Expected Metrics

- Note creation: < 100ms
- Thread loading: < 200ms
- Search response: < 150ms
- UI interaction: < 50ms
- Page load: < 1s

### Load Test Commands

```bash
# Create 1000 notes
bun run test:load -- --notes=1000

# Simulate concurrent users
bun run test:concurrent -- --users=10

# Measure search performance
bun run test:search -- --queries=100
```

## Validation Checklist

### Functional Requirements

- [ ] FR-001: Create markdown notes
- [ ] FR-002: Reply to create threads
- [ ] FR-003: Mention with @ID syntax
- [ ] FR-004: View threaded hierarchy
- [ ] FR-005: Search by content/mentions
- [ ] FR-007: Edit notes
- [ ] FR-008: Delete notes
- [ ] FR-009: Persist all data
- [ ] FR-010: Show timestamps
- [ ] FR-011: Display unique IDs
- [ ] FR-012: Enforce size limits
- [ ] FR-013: Markdown formatting
- [ ] FR-014: Split view layout
- [ ] FR-015: Chronological order
- [ ] FR-016: Infinite scroll
- [ ] FR-017: Cascade delete
- [ ] FR-018: Handle circular refs
- [ ] FR-019: No results for invalid
- [ ] FR-020: Graceful degradation

### Non-Functional Requirements

- [ ] Response time < 100ms
- [ ] Support 1000+ notes
- [ ] Offline capability
- [ ] Data integrity
- [ ] Accessibility (WCAG 2.1)

## Troubleshooting

### Common Issues

**Issue**: Notes not saving

```bash
# Check database connection
bun run db:test

# Verify permissions
ls -la data/notes.db
```

**Issue**: Search not working

```bash
# Rebuild search index
bun run search:reindex

# Check index status
bun run search:status
```

**Issue**: Performance degradation

```bash
# Clear caches
bun run cache:clear

# Optimize database
bun run db:optimize
```

---

_Use this guide for manual testing and acceptance validation._
