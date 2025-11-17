import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { noteService } from '../../src/services/note.service';
import { deleteService } from '../../src/services/delete.service';

// NOTE: Integration test for cascade deletion
describe('Delete Note with Cascade Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should delete note and all its replies (cascade)', async () => {
    // NOTE: Only 2 levels allowed - parent and direct children

    const parent = await noteService.createNote({ content: 'Parent' });
    const child1 = await noteService.createNote({
      content: 'Child 1',
      parentId: parent.id,
    });
    const child2 = await noteService.createNote({
      content: 'Child 2',
      parentId: parent.id, // Both children have same parent
    });

    await deleteService.deleteNote(parent.id);

    // Verify all notes in thread are deleted
    const remaining = await db.select().from(notes);
    expect(remaining).toHaveLength(0);
  });

  it('should not affect other threads when deleting', async () => {
    const thread1Root = await noteService.createNote({ content: 'Thread 1' });
    const thread1Child = await noteService.createNote({
      content: 'Thread 1 Child',
      parentId: thread1Root.id,
    });

    const thread2Root = await noteService.createNote({ content: 'Thread 2' });

    await deleteService.deleteNote(thread1Root.id);

    // Thread 2 should still exist
    const remaining = await db.select().from(notes);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(thread2Root.id);
  });
});
