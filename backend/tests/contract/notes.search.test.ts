import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import { sql } from 'drizzle-orm';
import type { SearchResponse } from '@thread-note/shared/types';
import { fetchJson } from '../helpers/fetch';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for GET /api/notes/search (search notes)
describe('GET /api/notes/search', () => {
  beforeAll(async () => {
    // NOTE: Create FTS5 table if it doesn't exist using Drizzle
    await db.run(sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
        note_id UNINDEXED,
        content,
        tokenize='unicode61'
      )
    `);

    // NOTE: Create searchable test data
    const testNote = {
      id: 'test01',
      content: 'This is a test note for search functionality',
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(notes).values(testNote).onConflictDoNothing();

    // Index in FTS5
    await db.run(sql`
      INSERT OR REPLACE INTO notes_fts(note_id, content)
      VALUES (${testNote.id}, ${testNote.content.toLowerCase()})
    `);

    // Create note that mentions another
    const mentionNote = {
      id: 'ment01',
      content: 'This mentions @abc123',
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(notes).values(mentionNote).onConflictDoNothing();

    await db.run(sql`
      INSERT OR REPLACE INTO notes_fts(note_id, content)
      VALUES (${mentionNote.id}, ${mentionNote.content.toLowerCase()})
    `);
  });
  it('should search notes by content', async () => {
    const { response, data } = await fetchJson<SearchResponse>(
      `${API_BASE_URL}/api/notes/search?q=test&type=content`
    );

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should search notes by mention', async () => {
    const { response, data } = await fetchJson<SearchResponse>(
      `${API_BASE_URL}/api/notes/search?q=abc123&type=mention`
    );

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });

  it('should default to content search when type not specified', async () => {
    const { response, data } = await fetchJson<SearchResponse>(
      `${API_BASE_URL}/api/notes/search?q=test`
    );

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });

  it('should respect limit parameter (default 20)', async () => {
    const { response, data } = await fetchJson<SearchResponse>(
      `${API_BASE_URL}/api/notes/search?q=test&limit=5`
    );

    expect(response.status).toBe(200);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  it('should require query parameter', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/search`);

    expect(response.status).toBe(400);
  });
});
