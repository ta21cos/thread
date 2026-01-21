/**
 * Integration tests for search routes
 *
 * Tests the actual HTTP endpoints for searching notes by content and mention.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';
import searchRoutes from '../../src/api/routes/search';
import { errorHandler } from '../../src/api/middleware/error';
import { generateId } from '../../src/domain/utils/id-generator';

// NOTE: Mock the getClerkClient function
const mockAuthenticateRequest = vi.fn();
const mockClerkClient: Partial<ClerkClient> = {
  authenticateRequest: mockAuthenticateRequest,
};

vi.mock('../../src/auth/clerk', () => ({
  getClerkClient: () => mockClerkClient,
}));

type TestBindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  APP_DOMAIN: string;
};

describe('Search Routes Integration Tests', () => {
  let app: Hono<{ Bindings: TestBindings }>;

  // Helper to clear tables
  const clearTables = async () => {
    await env.DB.exec('DELETE FROM search_index');
    await env.DB.exec('DELETE FROM mentions');
    await env.DB.exec('DELETE FROM notes');
  };

  // Helper to insert a note directly via D1
  const insertNote = async (note: {
    id: string;
    content: string;
    parentId: string | null;
    depth: number;
    createdAt: Date;
    updatedAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO notes (id, content, parent_id, depth, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(
        note.id,
        note.content,
        note.parentId,
        note.depth,
        note.createdAt.toISOString(),
        note.updatedAt.toISOString()
      )
      .run();
  };

  // Helper to insert search index entry directly via D1
  const insertSearchIndex = async (entry: {
    noteId: string;
    content: string;
    tokens: string;
    mentions: string | null;
    updatedAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO search_index (note_id, content, tokens, mentions, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(
        entry.noteId,
        entry.content,
        entry.tokens,
        entry.mentions,
        entry.updatedAt.toISOString()
      )
      .run();
  };

  // Helper to insert a mention directly via D1
  const insertMention = async (mention: {
    id: string;
    fromNoteId: string;
    toNoteId: string;
    position: number;
    createdAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO mentions (id, from_note_id, to_note_id, position, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(
        mention.id,
        mention.fromNoteId,
        mention.toNoteId,
        mention.position,
        mention.createdAt.toISOString()
      )
      .run();
  };

  beforeEach(async () => {
    // Clear database before each test
    await clearTables();

    // Reset mocks
    vi.clearAllMocks();

    // Mock authentication to succeed by default
    mockAuthenticateRequest.mockResolvedValue({
      isAuthenticated: true,
      toAuth: () => ({ userId: 'test_user_123', sessionId: 'test_session_456' }),
    });

    // Create a fresh Hono app with the search routes
    app = new Hono<{ Bindings: TestBindings }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.route('/api/notes', searchRoutes as any);
    app.onError(errorHandler);
  });

  // Helper function to make requests with env bindings
  const requestWithEnv = async (path: string, options: RequestInit = {}) => {
    const testEnv: TestBindings = {
      DB: env.DB,
      CLERK_SECRET_KEY: 'sk_test_mock',
      CLERK_PUBLISHABLE_KEY: 'pk_test_mock',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      APP_DOMAIN: 'http://localhost:3000',
    };
    return app.request(path, options, testEnv);
  };

  describe('GET /api/notes/search', () => {
    describe('content search (type=content)', () => {
      it('should return empty array when no matches', async () => {
        const res = await requestWithEnv('/api/notes/search?q=nonexistent&type=content&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body).toMatchObject({
          results: [],
          total: 0,
        });
      });

      it('should search notes by content', async () => {
        const noteId = generateId();
        const now = new Date();

        await insertNote({
          id: noteId,
          content: 'Hello world this is a test note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Insert search index entry
        await insertSearchIndex({
          noteId,
          content: 'Hello world this is a test note',
          tokens: 'hello world this is a test note',
          mentions: null,
          updatedAt: now,
        });

        const res = await requestWithEnv('/api/notes/search?q=hello&type=content&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(1);
        expect(body.results[0]).toMatchObject({
          id: noteId,
          content: 'Hello world this is a test note',
        });
        expect(body.total).toBe(1);
      });

      it('should search notes with multiple matches', async () => {
        const note1Id = generateId();
        const note2Id = generateId();
        const now = new Date();

        await insertNote({
          id: note1Id,
          content: 'TypeScript is awesome',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        });

        await insertNote({
          id: note2Id,
          content: 'I love TypeScript programming',
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000),
        });

        await insertSearchIndex({
          noteId: note1Id,
          content: 'TypeScript is awesome',
          tokens: 'typescript is awesome',
          mentions: null,
          updatedAt: now,
        });

        await insertSearchIndex({
          noteId: note2Id,
          content: 'I love TypeScript programming',
          tokens: 'i love typescript programming',
          mentions: null,
          updatedAt: new Date(now.getTime() + 1000),
        });

        const res = await requestWithEnv('/api/notes/search?q=typescript&type=content&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(2);
        expect(body.total).toBe(2);
      });

      it('should respect limit parameter', async () => {
        const now = new Date();

        // Create multiple notes
        for (let i = 0; i < 5; i++) {
          const noteId = generateId();
          await insertNote({
            id: noteId,
            content: `Test note ${i}`,
            parentId: null,
            depth: 0,
            createdAt: new Date(now.getTime() + i * 1000),
            updatedAt: new Date(now.getTime() + i * 1000),
          });

          await insertSearchIndex({
            noteId,
            content: `Test note ${i}`,
            tokens: `test note ${i}`,
            mentions: null,
            updatedAt: new Date(now.getTime() + i * 1000),
          });
        }

        const res = await requestWithEnv('/api/notes/search?q=test&type=content&limit=2', {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(2);
      });

      it('should default to content search when type is not specified', async () => {
        const noteId = generateId();
        const now = new Date();

        await insertNote({
          id: noteId,
          content: 'Default search test',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        });

        await insertSearchIndex({
          noteId,
          content: 'Default search test',
          tokens: 'default search test',
          mentions: null,
          updatedAt: now,
        });

        // No type parameter specified - should default to content
        const res = await requestWithEnv('/api/notes/search?q=default&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(1);
      });
    });

    describe('mention search (type=mention)', () => {
      it('should search notes by mention', async () => {
        const targetNoteId = generateId();
        const mentioningNoteId = generateId();
        const now = new Date();

        // Create target note
        await insertNote({
          id: targetNoteId,
          content: 'Target note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Create mentioning note
        await insertNote({
          id: mentioningNoteId,
          content: `This mentions @${targetNoteId}`,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000),
        });

        // Create mention record
        await insertMention({
          id: generateId(),
          fromNoteId: mentioningNoteId,
          toNoteId: targetNoteId,
          position: 14,
          createdAt: now,
        });

        const res = await requestWithEnv(
          `/api/notes/search?q=${targetNoteId}&type=mention&limit=20`,
          { method: 'GET' }
        );

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(1);
        expect(body.results[0].id).toBe(mentioningNoteId);
      });

      it('should return empty when note has no mentions', async () => {
        const noteId = generateId();
        const now = new Date();

        await insertNote({
          id: noteId,
          content: 'A note with no mentions',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        });

        const res = await requestWithEnv(`/api/notes/search?q=${noteId}&type=mention&limit=20`, {
          method: 'GET',
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.results).toHaveLength(0);
      });
    });

    describe('validation', () => {
      it('should return 400 when q parameter is missing', async () => {
        const res = await requestWithEnv('/api/notes/search?type=content&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(400);
      });

      it('should return 400 for empty q parameter', async () => {
        const res = await requestWithEnv('/api/notes/search?q=&type=content&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(400);
      });

      it('should return 400 for invalid type parameter', async () => {
        const res = await requestWithEnv('/api/notes/search?q=test&type=invalid&limit=20', {
          method: 'GET',
        });

        expect(res.status).toBe(400);
      });

      it('should return 400 for invalid limit parameter', async () => {
        const res = await requestWithEnv('/api/notes/search?q=test&type=content&limit=0', {
          method: 'GET',
        });

        expect(res.status).toBe(400);
      });

      it('should return 400 for limit exceeding max', async () => {
        const res = await requestWithEnv('/api/notes/search?q=test&type=content&limit=101', {
          method: 'GET',
        });

        expect(res.status).toBe(400);
      });
    });
  });
});
