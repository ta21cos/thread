import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { noteService } from '../../src/services/note.service';

// NOTE: Integration test for editing notes
describe('Edit Existing Note Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should update note content and timestamp', async () => {
    const note = await noteService.createNote({ content: 'Original content' });
    const originalUpdatedAt = note.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure timestamp changes

    const updated = await noteService.updateNote(note.id, {
      content: 'Updated content',
    });

    expect(updated.content).toBe('Updated content');
    expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    expect(updated.id).toBe(note.id);
  });

  it('should enforce 1000 character limit on update', async () => {
    const note = await noteService.createNote({ content: 'Short' });

    await expect(
      noteService.updateNote(note.id, {
        content: 'a'.repeat(1001),
      })
    ).rejects.toThrow();
  });
});
