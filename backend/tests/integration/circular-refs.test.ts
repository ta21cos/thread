import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';
import { NoteService } from '../../src/services/note.service';
import { MentionService } from '../../src/services/mention.service';

// NOTE: Integration test for circular reference prevention (from clarifications)
// This test MUST fail until services are implemented
describe('Prevent Circular References Scenario', () => {
  let noteService: NoteService;
  let mentionService: MentionService;

  beforeEach(async () => {
    await db.delete(notes);
    noteService = new NoteService();
    mentionService = new MentionService();
  });

  it('should detect and prevent circular mentions using DFS', async () => {
    // Create three notes without mentions first
    const noteA = await noteService.createNote({ content: 'Note A' });
    const noteB = await noteService.createNote({ content: 'Note B' });
    const noteC = await noteService.createNote({ content: 'Note C' });

    // Create mention chain: B -> A
    await noteService.updateNote(noteB.id, { content: `Note B mentions @${noteA.id}` });
    // C -> B
    await noteService.updateNote(noteC.id, { content: `Note C mentions @${noteB.id}` });

    // Now if A mentions C, it would create: A -> C -> B -> A (a cycle!)
    await expect(
      noteService.updateNote(noteA.id, { content: `Note A mentions @${noteC.id}` })
    ).rejects.toThrow(/circular/i);
  });

  it('should allow non-circular mention chains', async () => {
    // Create a valid chain without cycles
    const noteA = await noteService.createNote({ content: 'A' });
    const noteB = await noteService.createNote({ content: `B mentions @${noteA.id}` });
    const noteC = await noteService.createNote({ content: `C mentions @${noteB.id}` });
    const noteD = await noteService.createNote({ content: `D mentions @${noteC.id}` });

    // This creates a valid chain: D -> C -> B -> A (no cycle)
    // Now D should also be able to mention A directly (creating a shortcut, not a cycle)
    const updated = await noteService.updateNote(noteD.id, {
      content: `D mentions both @${noteC.id} and @${noteA.id}`,
    });
    expect(updated).toBeDefined();
    expect(updated.content).toContain(noteA.id);
  });

  it('should display error message when circular reference detected', async () => {
    const noteA = await noteService.createNote({ content: 'A' });
    const noteB = await noteService.createNote({ content: 'B' });

    // Create B -> A
    await noteService.updateNote(noteB.id, { content: `B mentions @${noteA.id}` });

    // Attempt to create circle: A -> B (would create A -> B -> A cycle)
    await expect(
      noteService.updateNote(noteA.id, { content: `A mentions @${noteB.id}` })
    ).rejects.toThrow(/circular/i);
  });
});
