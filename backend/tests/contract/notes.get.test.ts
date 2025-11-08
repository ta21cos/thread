import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';

// NOTE: Contract test for GET /api/notes (list root notes)
describe('GET /api/notes', () => {
  beforeAll(async () => {
    // NOTE: Ensure some root notes exist for testing
    await db.insert(notes).values([
      {
        id: 'root01',
        content: 'First root note',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'root02',
        content: 'Second root note',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]).onConflictDoNothing();

    // Also ensure child note exists to verify it's not included
    await db.insert(notes).values({
      id: 'child1',
      content: 'Child note (should not appear in root list)',
      parentId: 'root01',
      depth: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  });
  it('should return paginated list of root notes', async () => {
    const response = await fetch('http://localhost:3000/api/notes?limit=20&offset=0');
    const data = (await response.json()) as { notes: unknown[]; total: number; hasMore: boolean };

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('notes');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('hasMore');
    expect(Array.isArray(data.notes)).toBe(true);
  });

  it('should respect limit parameter (max 100)', async () => {
    const response = await fetch('http://localhost:3000/api/notes?limit=5');
    const data = (await response.json()) as { notes: unknown[] };

    expect(response.status).toBe(200);
    expect(data.notes.length).toBeLessThanOrEqual(5);
  });

  it('should return only root notes (no parent)', async () => {
    const response = await fetch('http://localhost:3000/api/notes');
    const data = (await response.json()) as { notes: Array<{ parentId: string | null }> };

    data.notes.forEach((note) => {
      expect(note.parentId).toBeNull();
    });
  });
});
