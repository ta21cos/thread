import { okAsync } from 'neverthrow';
import { createNoteService } from '../../services/note';
import { createThreadService } from '../../services/thread';
import { createTaskService } from '../../services/task';
import {
  validateCreateNote,
  validateUpdateNote,
  validateUpdateHidden,
  validateNoteId,
  validatePagination,
} from '../../middleware/validation';
import { requireAuth, getAuthUserId } from '../../middleware/auth.middleware';
import { handleServiceResponse, handleVoidResponse } from '../middleware/response-handler';
import type { NoteDetailResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { createRouter } from './router';

const app = createRouter()
  // GET /api/notes - List root notes
  .get('/', requireAuth, validatePagination, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });

    const { limit, offset } = c.req.valid('query');
    const includeHidden = c.req.query('includeHidden') === 'true';

    return handleServiceResponse(
      noteService.getRootNotes(limit, offset, includeHidden),
      c,
      (d) => ({
        notes: d.notes.map(serialize),
        total: d.total,
        hasMore: d.hasMore,
      })
    );
  })

  // POST /api/notes - Create note
  .post('/', requireAuth, validateCreateNote, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const taskService = createTaskService({ db });
    const authorId = getAuthUserId(c);
    const data = c.req.valid('json');

    return handleServiceResponse(
      noteService
        .createNote({ ...data, authorId })
        .andThen((note) =>
          taskService.syncTasksFromNote(note.id, authorId, note.content).map(() => note)
        ),
      c,
      serialize,
      201
    );
  })

  // GET /api/notes/:id - Get note with thread
  .get('/:id', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const threadService = createThreadService({ db });
    const { id } = c.req.valid('param');
    const includeThread = c.req.query('includeThread') !== 'false';

    return handleServiceResponse(
      noteService.getNoteById(id).andThen((note) =>
        (includeThread ? threadService.getThread(id) : okAsync([])).map((thread) => {
          const response: NoteDetailResponse = {
            note: serialize(note),
            thread: thread.map(serialize),
          };
          return response;
        })
      ),
      c
    );
  })

  // PUT /api/notes/:id - Update note
  .put('/:id', requireAuth, validateNoteId, validateUpdateNote, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const taskService = createTaskService({ db });
    const authorId = getAuthUserId(c);
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    return handleServiceResponse(
      noteService
        .updateNote(id, data)
        .andThen((note) =>
          taskService.syncTasksFromNote(note.id, authorId, note.content).map(() => note)
        ),
      c,
      serialize
    );
  })

  // PATCH /api/notes/:id/hidden - Update note hidden status
  .patch('/:id/hidden', requireAuth, validateNoteId, validateUpdateHidden, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const { id } = c.req.valid('param');
    const { isHidden } = c.req.valid('json');

    return handleServiceResponse(noteService.updateHidden(id, isHidden), c, serialize);
  })

  // DELETE /api/notes/:id - Delete note (cascade)
  .delete('/:id', requireAuth, validateNoteId, async (c) => {
    const db = c.get('db');
    const noteService = createNoteService({ db });
    const { id } = c.req.valid('param');

    return handleVoidResponse(noteService.deleteNote(id), c);
  });

export default app;
