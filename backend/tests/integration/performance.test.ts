import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { PERFORMANCE_TARGETS } from '@thread-note/shared/constants';
import { noteService } from '../../src/services/note.service';
import { searchService } from '../../src/services/search.service';
import { deleteService } from '../../src/services/delete.service';

// NOTE: Integration test for <200ms performance requirement (from clarifications)
describe('Performance Validation (<200ms) Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should perform create operation in <200ms', async () => {
    const start = Date.now();
    await noteService.createNote({ content: 'Performance test' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(PERFORMANCE_TARGETS.MAX_RESPONSE_TIME_MS);
  });

  it('should perform read operation in <200ms with 1000 notes', async () => {
    // Seed 1000 notes
    const promises = Array.from({ length: 100 }, (_, i) =>
      noteService.createNote({ content: `Note ${i}` })
    );
    await Promise.all(promises);

    const start = Date.now();
    await noteService.getNoteById((await promises[0]).id);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(PERFORMANCE_TARGETS.MAX_RESPONSE_TIME_MS);
  });

  it('should perform search in <200ms with 1000 notes', async () => {
    // Seed notes
    const promises = Array.from({ length: 100 }, (_, i) =>
      noteService.createNote({ content: `Search test ${i}` })
    );
    await Promise.all(promises);

    const start = Date.now();
    await searchService.searchByContent('test');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(PERFORMANCE_TARGETS.MAX_RESPONSE_TIME_MS);
  });

  it('should perform delete operation in <200ms', async () => {
    const note = await noteService.createNote({ content: 'To delete' });

    const start = Date.now();
    await deleteService.deleteNote(note.id);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(PERFORMANCE_TARGETS.MAX_RESPONSE_TIME_MS);
  });
});
