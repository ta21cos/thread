import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import { NoteService } from '../../src/services/note.service';

// NOTE: Integration test for 1000 character limit (from clarifications)
// This test MUST fail until services are implemented
describe('Enforce 1000 Character Limit Scenario', () => {
  let noteService: NoteService;

  beforeEach(async () => {
    await db.delete(notes);
    noteService = new NoteService();
  });

  it('should reject notes exceeding 1000 characters', async () => {
    const tooLong = 'a'.repeat(MAX_NOTE_LENGTH + 1);

    await expect(noteService.createNote({ content: tooLong })).rejects.toThrow(/1000.*character/i);
  });

  it('should accept notes at exactly 1000 characters', async () => {
    const exactLimit = 'a'.repeat(MAX_NOTE_LENGTH);

    const note = await noteService.createNote({ content: exactLimit });

    expect(note.content).toHaveLength(MAX_NOTE_LENGTH);
  });

  it('should display clear error message for length violation', async () => {
    const tooLong = 'a'.repeat(1001);

    try {
      await noteService.createNote({ content: tooLong });
      expect.fail('Should have thrown error');
    } catch (error: any) {
      expect(error.message).toMatch(/character/i);
      expect(error.message).toMatch(/1000/);
    }
  });
});
