import { noteService } from '../../services/note.service';
import { threadService } from '../../services/thread.service';
import { deleteService } from '../../services/delete.service';
import { bookmarkService } from '../../services/bookmark.service';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../middleware/validation';
import { requireAuth } from '../../auth/middleware/auth.middleware';
import type { NoteListResponse, NoteDetailResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { Hono } from 'hono';

const app = new Hono()
  // GET /api/notes - List root notes
  .get('/', requireAuth, validatePagination, async (c) => {
    const { limit, offset } = c.req.valid('query');
    const result = await noteService.getRootNotes(limit, offset);

    const response: NoteListResponse = {
      notes: result.notes.map(serialize),
      total: result.total,
      hasMore: result.hasMore,
    };

    return c.json(response);
  })
  // POST /api/notes - Create note
  .post('/', validateCreateNote, async (c) => {
    const data = c.req.valid('json');
    const note = await noteService.createNote(data);
    return c.json(serialize(note), 201);
  })
  // GET /api/notes/:id - Get note with thread
  .get('/:id', validateNoteId, async (c) => {
    const { id } = c.req.valid('param');
    const includeThread = c.req.query('includeThread') !== 'false';

    const note = await noteService.getNoteById(id);
    if (!note) {
      return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
    }

    const thread = includeThread ? await threadService.getThread(id) : [];

    const response: NoteDetailResponse = {
      note: serialize(note),
      thread: thread.map(serialize),
    };

    return c.json(response);
  })
  // PUT /api/notes/:id - Update note
  .put('/:id', requireAuth, validateNoteId, validateUpdateNote, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const updated = await noteService.updateNote(id, data);
    return c.json(serialize(updated));
  })
  // DELETE /api/notes/:id - Delete note (cascade)
  .delete('/:id', requireAuth, validateNoteId, async (c) => {
    const { id } = c.req.valid('param');
    await deleteService.deleteNote(id);
    return c.body(null, 204);
  })
  // GET /api/notes/bookmarked - List bookmarked notes
  .get('/bookmarked', requireAuth, validatePagination, async (c) => {
    const userId = c.get('userId');
    const { limit, offset } = c.req.valid('query');
    const result = await bookmarkService.getBookmarkedNotes(userId, limit, offset);

    const response: NoteListResponse = {
      notes: result.notes.map(serialize),
      total: result.total,
      hasMore: result.hasMore,
    };

    return c.json(response);
  })
  // PUT /api/notes/:id/bookmark - Toggle bookmark
  .put('/:id/bookmark', requireAuth, validateNoteId, async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    const result = await bookmarkService.toggleBookmark(userId, id);
    return c.json(result);
  })
  // DELETE /api/notes/:id/bookmark - Remove bookmark
  .delete('/:id/bookmark', requireAuth, validateNoteId, async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');

    await bookmarkService.toggleBookmark(userId, id);
    return c.body(null, 204);
  });

export default app;
