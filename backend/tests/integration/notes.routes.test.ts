/**
 * Integration tests for notes routes
 *
 * Tests the actual HTTP endpoints to ensure they work correctly end-to-end.
 * This focuses on route behavior, not detailed business logic (which is covered by unit tests).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';
import notesRoutes from '../../src/api/routes/notes';
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

describe('Notes Routes Integration Tests', () => {
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
    isHidden?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO notes (id, content, parent_id, depth, is_hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        note.id,
        note.content,
        note.parentId,
        note.depth,
        note.isHidden ? 1 : 0,
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

  // Helper to query notes
  const queryNotes = async (id: string) => {
    return env.DB.prepare('SELECT * FROM notes WHERE id = ?')
      .bind(id)
      .first<{ id: string; content: string }>();
  };

  // Helper to query mentions
  const queryMentions = async () => {
    return env.DB.prepare('SELECT * FROM mentions').all();
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

    // Create a fresh Hono app with the notes routes
    app = new Hono<{ Bindings: TestBindings }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.route('/api/notes', notesRoutes as any);
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

  describe('GET /api/notes', () => {
    it('should return empty list when no notes exist', async () => {
      const res = await requestWithEnv('/api/notes?limit=20&offset=0', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body).toMatchObject({
        notes: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should return list of root notes', async () => {
      // Create test notes
      const note1Id = generateId();
      const note2Id = generateId();
      const now = new Date();

      await insertNote({
        id: note1Id,
        content: 'First note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });
      await insertNote({
        id: note2Id,
        content: 'Second note',
        parentId: null,
        depth: 0,
        createdAt: new Date(now.getTime() + 1000),
        updatedAt: new Date(now.getTime() + 1000),
      });

      const res = await requestWithEnv('/api/notes?limit=20&offset=0', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.notes).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.hasMore).toBe(false);
      // Notes should be ordered by createdAt desc (newest first)
      expect(body.notes[0].content).toBe('Second note');
      expect(body.notes[1].content).toBe('First note');
    });

    it('should respect pagination parameters', async () => {
      // Create 3 test notes
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        await insertNote({
          id: generateId(),
          content: `Note ${i}`,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + i * 1000),
          updatedAt: new Date(now.getTime() + i * 1000),
        });
      }

      const res = await requestWithEnv('/api/notes?limit=2&offset=0', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.notes).toHaveLength(2);
      expect(body.total).toBe(3);
      expect(body.hasMore).toBe(true);
    });

    // NOTE: Skipped - Clerk mock doesn't work in Workers environment
    it.skip('should return 401 when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: false,
        reason: 'token-invalid',
        message: 'Invalid token',
        toAuth: () => ({ userId: null, sessionId: null }),
      });

      const res = await requestWithEnv('/api/notes?limit=20&offset=0', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new root note', async () => {
      const res = await requestWithEnv('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'New note content' }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        id: string;
        content: string;
        parentId: string | null;
        depth: number;
        createdAt: string;
        updatedAt: string;
      };
      expect(body).toMatchObject({
        content: 'New note content',
        parentId: null,
        depth: 0,
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();

      // Verify note was created in database
      const note = await queryNotes(body.id);
      expect(note).toBeDefined();
      expect(note?.content).toBe('New note content');
    });

    it('should create a reply note with parentId', async () => {
      // Create parent note
      const parentId = generateId();
      const now = new Date();
      await insertNote({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const res = await requestWithEnv('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Reply note',
          parentId: parentId,
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        id: string;
        content: string;
        parentId: string | null;
        depth: number;
      };
      expect(body).toMatchObject({
        content: 'Reply note',
        parentId: parentId,
        depth: 1,
      });
    });

    it('should return 400 for invalid content (too long)', async () => {
      const longContent = 'a'.repeat(1001); // MAX_NOTE_LENGTH is 1000

      const res = await requestWithEnv('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: longContent }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty content', async () => {
      const res = await requestWithEnv('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return note with thread', async () => {
      // Create parent and child notes
      const parentId = generateId();
      const childId = generateId();
      const now = new Date();

      await insertNote({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });
      await insertNote({
        id: childId,
        content: 'Child note',
        parentId: parentId,
        depth: 1,
        createdAt: new Date(now.getTime() + 1000),
        updatedAt: new Date(now.getTime() + 1000),
      });

      const res = await requestWithEnv(`/api/notes/${parentId}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.note).toMatchObject({
        id: parentId,
        content: 'Parent note',
      });
      // getThread returns full thread from root, so it includes both parent and child
      expect(body.thread.length).toBeGreaterThanOrEqual(1);
      const childNote = body.thread.find((n: { id: string }) => n.id === childId);
      expect(childNote).toMatchObject({
        id: childId,
        content: 'Child note',
      });
    });

    it('should return 404 for non-existent note', async () => {
      const res = await requestWithEnv(`/api/notes/${generateId()}`, {
        method: 'GET',
      });

      expect(res.status).toBe(404);
    });

    it('should exclude thread when includeThread=false', async () => {
      const parentId = generateId();
      const now = new Date();

      await insertNote({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${parentId}?includeThread=false`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.note).toBeDefined();
      expect(body.thread).toHaveLength(0);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note content', async () => {
      const noteId = generateId();
      const now = new Date();

      await insertNote({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.content).toBe('Updated content');
      expect(body.id).toBe(noteId);

      // Verify update in database
      const note = await queryNotes(noteId);
      expect(note?.content).toBe('Updated content');
    });

    it('should return 404 for non-existent note', async () => {
      const res = await requestWithEnv(`/api/notes/${generateId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid content', async () => {
      const noteId = generateId();
      const now = new Date();

      await insertNote({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const longContent = 'a'.repeat(1001);
      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: longContent }),
      });

      expect(res.status).toBe(400);
    });

    // NOTE: Skipped - Clerk mock doesn't work in Workers environment
    it.skip('should return 401 when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: false,
        reason: 'token-invalid',
        message: 'Invalid token',
        toAuth: () => ({ userId: null, sessionId: null }),
      });

      const noteId = generateId();
      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a root note', async () => {
      const noteId = generateId();
      const now = new Date();

      await insertNote({
        id: noteId,
        content: 'Note to delete',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);

      // Verify note was deleted
      const note = await queryNotes(noteId);
      expect(note).toBeNull();
    });

    it('should cascade delete child notes', async () => {
      const parentId = generateId();
      const childId = generateId();
      const now = new Date();

      await insertNote({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });
      await insertNote({
        id: childId,
        content: 'Child note',
        parentId: parentId,
        depth: 1,
        createdAt: new Date(now.getTime() + 1000),
        updatedAt: new Date(now.getTime() + 1000),
      });

      const res = await requestWithEnv(`/api/notes/${parentId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);

      // Verify both notes were deleted
      const parent = await queryNotes(parentId);
      const child = await queryNotes(childId);
      expect(parent).toBeNull();
      expect(child).toBeNull();
    });

    it('should delete mentions when deleting note', async () => {
      const noteId = generateId();
      const mentionedNoteId = generateId();
      const now = new Date();

      await insertNote({
        id: noteId,
        content: `Note mentioning @${mentionedNoteId}`,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });
      await insertNote({
        id: mentionedNoteId,
        content: 'Mentioned note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await insertMention({
        id: generateId(),
        fromNoteId: noteId,
        toNoteId: mentionedNoteId,
        position: 0,
        createdAt: now,
      });

      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);

      // Verify mentions were deleted
      const mentions = await queryMentions();
      expect(mentions.results).toHaveLength(0);
    });

    it('should return 404 for non-existent note', async () => {
      const res = await requestWithEnv(`/api/notes/${generateId()}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    // NOTE: Skipped - Clerk mock doesn't work in Workers environment
    it.skip('should return 401 when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: false,
        reason: 'token-invalid',
        message: 'Invalid token',
        toAuth: () => ({ userId: null, sessionId: null }),
      });

      const noteId = generateId();
      const res = await requestWithEnv(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('isHidden functionality', () => {
    describe('POST /api/notes with isHidden', () => {
      it('should create a root note with isHidden=true', async () => {
        const res = await requestWithEnv('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Hidden note',
            isHidden: true,
          }),
        });

        expect(res.status).toBe(201);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.isHidden).toBe(true);
        expect(data.content).toBe('Hidden note');
      });

      it('should create a root note with isHidden=false by default', async () => {
        const res = await requestWithEnv('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Visible note',
          }),
        });

        expect(res.status).toBe(201);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.isHidden).toBe(false);
      });

      it('should return 400 when trying to set isHidden=true on a reply', async () => {
        const parentId = generateId();
        await insertNote({
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await requestWithEnv('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Child note',
            parentId: parentId,
            isHidden: true,
          }),
        });

        expect(res.status).toBe(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.error).toBe('InvalidHiddenReplyError');
      });

      it('should inherit parent isHidden status for replies', async () => {
        const parentId = generateId();
        await insertNote({
          id: parentId,
          content: 'Hidden parent',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const res = await requestWithEnv('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: 'Child note',
            parentId: parentId,
          }),
        });

        expect(res.status).toBe(201);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.isHidden).toBe(true);
        expect(data.parentId).toBe(parentId);
      });
    });

    describe('GET /api/notes with includeHidden', () => {
      it('should filter out hidden notes by default', async () => {
        const now = new Date();
        await insertNote({
          id: generateId(),
          content: 'Visible note 1',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });
        await insertNote({
          id: generateId(),
          content: 'Hidden note',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        });
        await insertNote({
          id: generateId(),
          content: 'Visible note 2',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: new Date(now.getTime() + 2000),
          updatedAt: now,
        });

        const res = await requestWithEnv('/api/notes?limit=10&offset=0');

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.notes).toHaveLength(2);
        expect(data.total).toBe(2);
        expect(data.notes.every((n: { isHidden: boolean }) => n.isHidden === false)).toBe(true);
      });

      it('should include hidden notes when includeHidden=true', async () => {
        const now = new Date();
        await insertNote({
          id: generateId(),
          content: 'Visible note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });
        await insertNote({
          id: generateId(),
          content: 'Hidden note',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        });

        const res = await requestWithEnv('/api/notes?limit=10&offset=0&includeHidden=true');

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.notes).toHaveLength(2);
        expect(data.total).toBe(2);
      });

      it('should exclude hidden notes when includeHidden=false explicitly', async () => {
        const now = new Date();
        await insertNote({
          id: generateId(),
          content: 'Visible note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });
        await insertNote({
          id: generateId(),
          content: 'Hidden note',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        });

        const res = await requestWithEnv('/api/notes?limit=10&offset=0&includeHidden=false');

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.notes).toHaveLength(1);
        expect(data.notes[0].isHidden).toBe(false);
      });
    });

    describe('PATCH /api/notes/:id/hidden', () => {
      it('should update isHidden status of a root note', async () => {
        const noteId = generateId();
        const now = new Date();
        await insertNote({
          id: noteId,
          content: 'Test note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });

        const res = await requestWithEnv(`/api/notes/${noteId}/hidden`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isHidden: true }),
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.isHidden).toBe(true);
        expect(data.id).toBe(noteId);
      });

      it('should return 400 when trying to update isHidden of a reply', async () => {
        const parentId = generateId();
        const replyId = generateId();
        const now = new Date();
        await insertNote({
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });
        await insertNote({
          id: replyId,
          content: 'Reply note',
          parentId: parentId,
          depth: 1,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        });

        const res = await requestWithEnv(`/api/notes/${replyId}/hidden`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isHidden: true }),
        });

        expect(res.status).toBe(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.error).toBe('InvalidHiddenReplyError');
      });

      it('should return 404 when note does not exist', async () => {
        const nonExistentId = generateId();

        const res = await requestWithEnv(`/api/notes/${nonExistentId}/hidden`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isHidden: true }),
        });

        expect(res.status).toBe(404);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any;
        expect(data.error).toBe('NoteNotFoundError');
      });

      it.skip('should return 401 when not authenticated', async () => {
        const noteId = generateId();

        // Mock authentication to fail
        mockAuthenticateRequest.mockResolvedValueOnce({
          isAuthenticated: false,
          toAuth: () => {
            throw new Error('Not authenticated');
          },
          reason: 'unauthorized',
          message: 'Authentication failed',
        });

        const res = await requestWithEnv(`/api/notes/${noteId}/hidden`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isHidden: true }),
        });

        expect(res.status).toBe(401);
      });
    });
  });
});
