import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { noteService } from '../../src/services/note.service';
import { threadService } from '../../src/services/thread.service';

// NOTE: Integration test for thread navigation
describe('Navigate Thread Hierarchy Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should navigate from any note to thread root', async () => {
    // NOTE: Only 2 levels allowed - test parent-child navigation

    const root = await noteService.createNote({ content: 'Root' });
    const child = await noteService.createNote({
      content: 'Child',
      parentId: root.id,
    });

    // Get thread from child should return both parent and child
    const thread = await threadService.getThread(child.id);

    expect(thread[0].id).toBe(root.id);
    expect(thread).toHaveLength(2); // Only parent and child
    expect(thread[1].id).toBe(child.id);
  });

  it('should show threaded/nested format with parent-child relationships', async () => {
    const parent = await noteService.createNote({ content: 'Parent' });
    const child1 = await noteService.createNote({
      content: 'Child 1',
      parentId: parent.id,
    });
    const child2 = await noteService.createNote({
      content: 'Child 2',
      parentId: parent.id,
    });

    const thread = await threadService.getThread(parent.id);

    expect(thread).toHaveLength(3);
    expect(thread.filter((n) => n.parentId === parent.id)).toHaveLength(2);
  });
});
