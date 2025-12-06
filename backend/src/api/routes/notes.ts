import type { ResultAsync } from 'neverthrow';
import { createNoteService } from '../../services/note.service';
import { ThreadService } from '../../services/thread.service';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth.middleware';
import type {
  NoteListResponse,
  NoteDetailResponse,
  ErrorResponse,
} from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { db } from '../../db';
import { createRouter } from './router';

/**
 * NoteError を ErrorResponse に変換
 */
const toErrorResponse = (error: NoteError): ErrorResponse => ({
  error: error._tag,
  message: error.message,
});

/**
 * Result のマッチングによるレスポンス生成
 *
 * この関数により、ルートハンドラ内で一貫したエラーハンドリングが可能
 */
const handleResult = async <T>(
  c: {
    json: (body: unknown, status?: number) => Response;
    body: (body: unknown, status?: number) => Response;
  },
  resultAsync: ResultAsync<T, NoteError>,
  onSuccess: (
    value: T
  ) => { body: unknown; status?: number } | Promise<{ body: unknown; status?: number }>
) => {
  const result = await resultAsync;

  if (result.isOk()) {
    const response = await onSuccess(result.value);
    // 204 No Content の場合は body メソッドを使用
    if (response.status === 204) {
      return c.body(response.body, response.status);
    }
    return c.json(response.body, response.status);
  }

  const error = result.error;
  return c.json(toErrorResponse(error), errorToStatusCode(error));
};

const functionalNoteService = createNoteService({ db });

const app = createRouter()
  // GET /api/notes - List root notes
  .get('/', requireAuth, validatePagination, async (c) => {
    const { limit, offset } = c.req.valid('query');

    return handleResult(c, functionalNoteService.getRootNotes(limit, offset), (data) => {
      const response: NoteListResponse = {
        notes: data.notes.map(serialize),
        total: data.total,
        hasMore: data.hasMore,
      };
      return { body: response };
    });
  })

  // POST /api/notes - Create note
  .post('/', requireAuth, validateCreateNote, async (c) => {
    const data = c.req.valid('json');

    return handleResult(c, functionalNoteService.createNote(data), (note) => ({
      body: serialize(note),
      status: 201,
    }));
  })

  // GET /api/notes/:id - Get note with thread
  .get('/:id', requireAuth, validateNoteId, async (c) => {
    const { id } = c.req.valid('param');
    const includeThread = c.req.query('includeThread') !== 'false';

    return handleResult(c, functionalNoteService.getNoteById(id), async (note) => {
      const threadService = new ThreadService({ db });
      const thread = includeThread ? await threadService.getThread(id) : [];

      const response: NoteDetailResponse = {
        note: serialize(note),
        thread: thread.map(serialize),
      };
      return { body: response };
    });
  })

  // PUT /api/notes/:id - Update note
  .put('/:id', requireAuth, validateNoteId, validateUpdateNote, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    return handleResult(c, functionalNoteService.updateNote(id, data), (note) => ({
      body: serialize(note),
    }));
  })

  // DELETE /api/notes/:id - Delete note (cascade)
  .delete('/:id', requireAuth, validateNoteId, async (c) => {
    const { id } = c.req.valid('param');

    return handleResult(c, functionalNoteService.deleteNote(id), () => ({
      body: null,
      status: 204,
    }));
  });

export default app;
