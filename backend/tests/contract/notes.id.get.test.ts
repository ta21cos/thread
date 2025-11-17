import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import { eq } from 'drizzle-orm';
import type { NoteDetailResponse } from '@thread-note/shared/types';
import { fetchJson } from '../helpers/fetch';

const API_BASE_URL = process.env.API_BASE_URL;

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
    const { response, data } = await fetchJson<NoteDetailResponse>(
      `${API_BASE_URL}/api/notes/abc123?includeThread=true`
    );

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data).toHaveProperty('thread');
    expect(Array.isArray(data.thread)).toBe(true);
  });

  it('should return only note without thread when includeThread=false', async () => {
    const { response, data } = await fetchJson<NoteDetailResponse>(
      `${API_BASE_URL}/api/notes/abc123?includeThread=false`
    );

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data.thread).toBeUndefined();
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/999999`);

    expect(response.status).toBe(404);
  });

  it('should validate ID format (6-char alphanumeric)', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/invalid-id`);

    expect(response.status).toBe(400);
  });
});
