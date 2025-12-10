import { ResultAsync } from 'neverthrow';
import { createNoteService } from '../../services/note.service';
import { ThreadService } from '../../services/thread.service';
import { errorToStatusCode, databaseError, type NoteError } from '../../errors/domain-errors';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import type { NoteDetailResponse, ErrorResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

/**
 * NoteError を ErrorResponse に変換
 */
const toErrorResponse = (error: NoteError): ErrorResponse => ({
  error: error._tag,
  message: error.message,
});

const app = createRouter()
  // GET /api/notes - List root notes
  .get('/', requireAuth, validatePagination, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });

    const { limit, offset } = c.req.valid('query');

    return await noteService
      .getRootNotes(limit, offset)
      .map((d) => ({
        notes: d.notes.map(serialize),
        total: d.total,
        hasMore: d.hasMore,
      }))
      .match(
        (data) => c.json(data),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  })

  // POST /api/notes - Create note
  .post('/', requireAuth, validateCreateNote, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const data = c.req.valid('json');

    return await noteService
      .createNote(data)
      .map(serialize)
      .match(
        (data) => c.json(data, 201),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  })

  // GET /api/notes/:id - Get note with thread
  .get('/:id', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const threadService = new ThreadService({ db });
    const { id } = c.req.valid('param');
    const includeThread = c.req.query('includeThread') !== 'false';

    return await noteService
      .getNoteById(id)
      .andThen((note) => {
        return ResultAsync.fromPromise(
          includeThread ? threadService.getThread(id) : Promise.resolve([]),
          (error) => databaseError('Failed to get thread', error)
        ).map((thread) => {
          const response: NoteDetailResponse = {
            note: serialize(note),
            thread: thread.map(serialize),
          };
          return response;
        });
      })
      .match(
        (data) => c.json(data),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  })

  // PUT /api/notes/:id - Update note
  .put('/:id', requireAuth, validateNoteId, validateUpdateNote, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    return await noteService
      .updateNote(id, data)
      .map(serialize)
      .match(
        (data) => c.json(data),
        (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
      );
  })

  // DELETE /api/notes/:id - Delete note (cascade)
  .delete('/:id', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const { id } = c.req.valid('param');

    return await noteService.deleteNote(id).match(
      () => c.body(null, 204),
      (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
    );
  });

export default app;
