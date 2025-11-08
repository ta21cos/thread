import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import { eq } from 'drizzle-orm';

// NOTE: Contract test for GET /api/notes/:id (get note with thread)
describe('GET /api/notes/:id', () => {
  beforeAll(async () => {
    // NOTE: Ensure test data exists
    const existing = await db.select().from(notes).where(eq(notes.id, 'abc123'));
    if (existing.length === 0) {
      await db.insert(notes).values({
        id: 'abc123',
        content: 'Test note for contract tests',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  it('should return note details with thread', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123?includeThread=true');
    const data = (await response.json()) as { note: unknown; thread: unknown[] };

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data).toHaveProperty('thread');
    expect(Array.isArray(data.thread)).toBe(true);
  });

  it('should return only note without thread when includeThread=false', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123?includeThread=false');
    const data = (await response.json()) as { note: unknown; thread?: unknown };

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data.thread).toBeUndefined();
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/999999');

    expect(response.status).toBe(404);
  });

  it('should validate ID format (6-char alphanumeric)', async () => {
    const response = await fetch('http://localhost:3000/api/notes/invalid-id');

    expect(response.status).toBe(400);
  });
});
