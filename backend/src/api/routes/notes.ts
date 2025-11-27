import { noteService } from '../../services/note.service';
import { threadService } from '../../services/thread.service';
import { deleteService } from '../../services/delete.service';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../middleware/validation';
import { requireAuth } from '../../auth/middleware/auth.middleware';
import type { NoteListResponse, NoteDetailResponse, ErrorResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { Hono } from 'hono';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';

/** Convert NoteError to ErrorResponse */
const toErrorResponse = (error: NoteError): ErrorResponse => ({
  error: error._tag,
  message: error.message,
});

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
  // Uses neverthrow Result type for type-safe error handling
  .get('/:id', validateNoteId, async (c) => {
    const { id } = c.req.valid('param');
    const includeThread = c.req.query('includeThread') !== 'false';

    const result = await noteService.getNoteByIdResult(id);

    if (result.isErr()) {
      const error = result.error;
      return c.json(toErrorResponse(error), errorToStatusCode(error));
    }

    const note = result.value;
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
  });

export default app;
