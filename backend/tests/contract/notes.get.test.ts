import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import type { NoteListResponse, Note } from '@thread-note/shared/types';
import { fetchJson } from '../helpers/fetch';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for GET /api/notes (list root notes)
describe('GET /api/notes', () => {
  beforeAll(async () => {
    // NOTE: Ensure some root notes exist for testing
    await db
      .insert(notes)
      .values([
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
      ])
      .onConflictDoNothing();

    // Also ensure child note exists to verify it's not included
    await db
      .insert(notes)
      .values({
        id: 'child1',
        content: 'Child note (should not appear in root list)',
        parentId: 'root01',
        depth: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  });
  it('should return paginated list of root notes', async () => {
    const { response, data } = await fetchJson<NoteListResponse>(
      `${API_BASE_URL}/api/notes?limit=20&offset=0`
    );

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('notes');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('hasMore');
    expect(Array.isArray(data.notes)).toBe(true);
  });

  it('should respect limit parameter (max 100)', async () => {
    const { response, data } = await fetchJson<NoteListResponse>(
      `${API_BASE_URL}/api/notes?limit=5`
    );

    expect(response.status).toBe(200);
    expect(data.notes.length).toBeLessThanOrEqual(5);
  });

  it('should return only root notes (no parent)', async () => {
    const { response, data } = await fetchJson<NoteListResponse>(`${API_BASE_URL}/api/notes`);

    data.notes.forEach((note: Note) => {
      expect(note.parentId).toBeNull();
    });
  });
});
