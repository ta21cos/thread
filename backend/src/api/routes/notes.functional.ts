/**
 * Functional Notes Routes with neverthrow
 *
 * 関数型サービスを使用したルートハンドラの例。
 * Result型を使ったエラーハンドリングにより、
 * 型安全かつ明示的なHTTPレスポンス生成が可能。
 */

import { Hono } from 'hono';
import type { ResultAsync } from 'neverthrow';
import { functionalNoteService } from '../../services/note.service.functional';
import { ThreadService } from '../../services/thread.service';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../middleware/validation';
import { requireAuth } from '../../auth/middleware/auth.middleware';
import type { NoteListResponse, NoteDetailResponse, ErrorResponse } from '@thread-note/shared/types';
import { serialize } from '../../types/api';
import { db } from '../../db';

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
  c: { json: (body: unknown, status?: number) => Response },
  resultAsync: ResultAsync<T, NoteError>,
  onSuccess: (value: T) => { body: unknown; status?: number } | Promise<{ body: unknown; status?: number }>
) => {
  const result = await resultAsync;

  if (result.isOk()) {
    const response = await onSuccess(result.value);
    return c.json(response.body, response.status);
  }

  const error = result.error;
  return c.json(toErrorResponse(error), errorToStatusCode(error));
};

const app = new Hono()
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
  .post('/', validateCreateNote, async (c) => {
    const data = c.req.valid('json');

    return handleResult(c, functionalNoteService.createNote(data), (note) => ({
      body: serialize(note),
      status: 201,
    }));
  })

  // GET /api/notes/:id - Get note with thread
  .get('/:id', validateNoteId, async (c) => {
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
  });

export default app;

/**
 * 使用例と比較
 *
 * === Before (throw/catch) ===
 *
 * .post('/', validateCreateNote, async (c) => {
 *   const data = c.req.valid('json');
 *   const note = await noteService.createNote(data);  // throwする可能性
 *   return c.json(serialize(note), 201);
 * })
 *
 * エラーは error middleware で catch される。
 * エラーの種類は文字列マッチングで判定。
 *
 * === After (neverthrow) ===
 *
 * .post('/', validateCreateNote, async (c) => {
 *   const data = c.req.valid('json');
 *
 *   return handleResult(
 *     c,
 *     functionalNoteService.createNote(data),  // Result<Note, NoteError>
 *     (note) => ({ body: serialize(note), status: 201 })
 *   );
 * })
 *
 * メリット:
 * 1. エラーが型で表現される (NoteError union type)
 * 2. エラーハンドリングが明示的で忘れられない
 * 3. HTTPステータスコードが型から自動決定
 * 4. テストでエラーケースを簡単に検証可能
 */
