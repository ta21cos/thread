/**
 * Integration tests for mentions routes
 *
 * Tests the actual HTTP endpoints for getting notes that mention a specific note.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';
import mentionsRoutes from '../../src/api/routes/mentions';
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

describe('Mentions Routes Integration Tests', () => {
  let app: Hono<{ Bindings: TestBindings }>;

  // Helper to clear tables
  const clearTables = async () => {
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

    // Create a fresh Hono app with the mentions routes
    app = new Hono<{ Bindings: TestBindings }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.route('/api/notes', mentionsRoutes as any);
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

  describe('GET /api/notes/:id/mentions', () => {
    it('should return empty array when no mentions exist', async () => {
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

      const res = await requestWithEnv(`/api/notes/${noteId}/mentions`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body).toMatchObject({
        mentions: [],
      });
    });

    it('should return mentions for a note', async () => {
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

      // Create note that mentions target
      await insertNote({
        id: mentioningNoteId,
        content: `Note mentioning @${targetNoteId}`,
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
        position: 17,
        createdAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${targetNoteId}/mentions`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.mentions).toHaveLength(1);
      expect(body.mentions[0]).toMatchObject({
        note: expect.objectContaining({
          id: mentioningNoteId,
          content: `Note mentioning @${targetNoteId}`,
        }),
        position: 17,
      });
    });

    it('should return multiple mentions', async () => {
      const targetNoteId = generateId();
      const mentioningNote1Id = generateId();
      const mentioningNote2Id = generateId();
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

      // Create notes that mention target
      await insertNote({
        id: mentioningNote1Id,
        content: `First mention @${targetNoteId}`,
        parentId: null,
        depth: 0,
        createdAt: new Date(now.getTime() + 1000),
        updatedAt: new Date(now.getTime() + 1000),
      });

      await insertNote({
        id: mentioningNote2Id,
        content: `Second mention @${targetNoteId}`,
        parentId: null,
        depth: 0,
        createdAt: new Date(now.getTime() + 2000),
        updatedAt: new Date(now.getTime() + 2000),
      });

      // Create mention records
      await insertMention({
        id: generateId(),
        fromNoteId: mentioningNote1Id,
        toNoteId: targetNoteId,
        position: 14,
        createdAt: now,
      });

      await insertMention({
        id: generateId(),
        fromNoteId: mentioningNote2Id,
        toNoteId: targetNoteId,
        position: 15,
        createdAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${targetNoteId}/mentions`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.mentions).toHaveLength(2);
    });

    it('should return 404 for non-existent note', async () => {
      const nonExistentId = generateId();

      const res = await requestWithEnv(`/api/notes/${nonExistentId}/mentions`, {
        method: 'GET',
      });

      expect(res.status).toBe(404);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.error).toBe('NoteNotFoundError');
    });

    it('should return 400 for invalid note ID format', async () => {
      const res = await requestWithEnv('/api/notes/invalid-id/mentions', {
        method: 'GET',
      });

      expect(res.status).toBe(400);
    });
  });
});
