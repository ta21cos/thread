/**
 * Integration tests for notes routes
 *
 * Tests the actual HTTP endpoints to ensure they work correctly end-to-end.
 * This focuses on route behavior, not detailed business logic (which is covered by unit tests).
 */

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import notesRoutes from '../../src/api/routes/notes';
import { errorHandler } from '../../src/middleware/error';
import { db, notes, mentions } from '../../src/db';
import { generateId } from '../../src/utils/id-generator';

// NOTE: Set env vars before importing clerk module
beforeAll(() => {
  process.env.CLERK_SECRET_KEY = 'sk_test_mock';
  process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
  process.env.APP_DOMAIN = 'http://localhost:3000';
});

// NOTE: Mock the getClerkClient function
const mockAuthenticateRequest = vi.fn();
const mockClerkClient: Partial<ClerkClient> = {
  authenticateRequest: mockAuthenticateRequest,
};

vi.mock('../../src/auth/clerk', () => ({
  getClerkClient: () => mockClerkClient,
}));

type TestBindings = {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  APP_DOMAIN: string;
};

describe('Notes Routes Integration Tests', () => {
  let app: Hono<{ Bindings: TestBindings }>;

  beforeEach(async () => {
    // Clear database before each test
    await db.delete(mentions);
    await db.delete(notes);

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
    const env: TestBindings = {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_test_mock',
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_mock',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
      APP_DOMAIN: process.env.APP_DOMAIN || 'http://localhost:3000',
    };
    return app.request(path, options, env);
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

      await db.insert(notes).values([
        {
          id: note1Id,
          content: 'First note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: note2Id,
          content: 'Second note',
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000),
        },
      ]);

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
        await db.insert(notes).values({
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

    it('should return 401 when not authenticated', async () => {
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
      const [note] = await db.select().from(notes).where(eq(notes.id, body.id));
      expect(note).toBeDefined();
      expect(note.content).toBe('New note content');
    });

    it('should create a reply note with parentId', async () => {
      // Create parent note
      const parentId = generateId();
      const now = new Date();
      await db.insert(notes).values({
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
      const body = (await res.json()) as { id: string; content: string; parentId: string | null; depth: number };
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

      await db.insert(notes).values([
        {
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId,
          content: 'Child note',
          parentId: parentId,
          depth: 1,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000),
        },
      ]);

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

      await db.insert(notes).values({
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

      await db.insert(notes).values({
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
      const [note] = await db.select().from(notes).where(eq(notes.id, noteId));
      expect(note.content).toBe('Updated content');
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

      await db.insert(notes).values({
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

    it('should return 401 when not authenticated', async () => {
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

      await db.insert(notes).values({
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
      const [note] = await db.select().from(notes).where(eq(notes.id, noteId));
      expect(note).toBeUndefined();
    });

    it('should cascade delete child notes', async () => {
      const parentId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId,
          content: 'Child note',
          parentId: parentId,
          depth: 1,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: new Date(now.getTime() + 1000),
        },
      ]);

      const res = await requestWithEnv(`/api/notes/${parentId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);

      // Verify both notes were deleted
      const [parent] = await db.select().from(notes).where(eq(notes.id, parentId));
      const [child] = await db.select().from(notes).where(eq(notes.id, childId));
      expect(parent).toBeUndefined();
      expect(child).toBeUndefined();
    });

    it('should delete mentions when deleting note', async () => {
      const noteId = generateId();
      const mentionedNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId,
          content: `Note mentioning @${mentionedNoteId}`,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: mentionedNoteId,
          content: 'Mentioned note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
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
      const allMentions = await db.select().from(mentions);
      expect(allMentions).toHaveLength(0);
    });

    it('should return 404 for non-existent note', async () => {
      const res = await requestWithEnv(`/api/notes/${generateId()}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    it('should return 401 when not authenticated', async () => {
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
});
