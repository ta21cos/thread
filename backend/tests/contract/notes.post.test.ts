import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import type { Note } from '@thread-note/shared/types';
import { fetchJson } from '../helpers/fetch';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for POST /api/notes (create note)
describe('POST /api/notes', () => {
  beforeAll(async () => {
    // NOTE: Ensure parent note exists for reply test
    await db
      .insert(notes)
      .values({
        id: 'abc123',
        content: 'Parent note for replies',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  });
  it('should create a new root note', async () => {
    const { response, data } = await fetchJson<Note>(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test note' }),
    });

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.content).toBe('Test note');
    expect(data.parentId).toBeNull();
    expect(data.depth).toBe(0);
  });

  it('should create a reply note with parentId', async () => {
    const { response, data } = await fetchJson<Note>(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Reply note',
        parentId: 'abc123',
      }),
    });

    expect(response.status).toBe(201);
    expect(data.parentId).toBe('abc123');
    expect(data.depth).toBeGreaterThan(0);
  });

  it('should reject note exceeding 1000 characters', async () => {
    const longContent = 'a'.repeat(1001);
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject empty content', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('should validate parentId format (6-char alphanumeric)', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test',
        parentId: 'invalid-id',
      }),
    });

    expect(response.status).toBe(400);
  });
});
