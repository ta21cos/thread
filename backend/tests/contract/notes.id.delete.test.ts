import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for DELETE /api/notes/:id (delete note with cascade)
describe('DELETE /api/notes/:id', () => {
  beforeEach(async () => {
    // NOTE: Create fresh test data for each test
    await db
      .insert(notes)
      .values({
        id: 'abc123',
        content: 'Test note to delete',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    // Create parent-child structure for cascade test
    await db
      .insert(notes)
      .values({
        id: 'prnt23',
        content: 'Parent note',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    await db
      .insert(notes)
      .values({
        id: 'chld56',
        content: 'Child note',
        parentId: 'prnt23',
        depth: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  });

  it('should delete note and return 204', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
  });

  it('should cascade delete all child notes', async () => {
    // Delete parent
    await fetch(`${API_BASE_URL}/api/notes/prnt23`, {
      method: 'DELETE',
    });

    // Verify children are also deleted
    const childResponse = await fetch(`${API_BASE_URL}/api/notes/chld56`);
    expect(childResponse.status).toBe(404);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/999999`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(404);
  });
});
