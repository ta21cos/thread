/**
 * Response Handler Middleware
 *
 * 共通のレスポンス処理ユーティリティ
 */

import type { Context } from 'hono';
import type { ResultAsync } from 'neverthrow';
import { errorToStatusCode, type NoteError } from '../../errors/domain-errors';
import type { ErrorResponse } from '@thread-note/shared/types';

/**
 * NoteError を ErrorResponse に変換
 */
export const toErrorResponse = (error: NoteError): ErrorResponse => ({
  error: error._tag,
  message: error.message,
});

/**
 * サービスレスポンスを統一的に処理
 *
 * @example
 * ```ts
 * return handleServiceResponse(
 *   noteService.getNoteById(id),
 *   c,
 *   serialize
 * );
 * ```
 */
export const handleServiceResponse = <T, R = T>(
  result: ResultAsync<T, NoteError>,
  c: Context,
  transform?: (data: T) => R,
  statusCode: number = 200
): Promise<Response> =>
  result.map(transform ?? ((x: T) => x as unknown as R)).match(
    (data) => c.json(data, statusCode as 200),
    (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
  );

/**
 * 空レスポンス（204 No Content）用のハンドラ
 */
export const handleVoidResponse = (
  result: ResultAsync<void, NoteError>,
  c: Context
): Promise<Response> =>
  result.match(
    () => c.body(null, 204),
    (error: NoteError) => c.json(toErrorResponse(error), errorToStatusCode(error))
  );
