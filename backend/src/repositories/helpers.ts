/**
 * Repository Helpers
 *
 * リポジトリ共通のユーティリティ関数。
 */

import { ResultAsync } from 'neverthrow';
import { databaseError, type NoteError } from '../errors/domain-errors';

/**
 * Promise を ResultAsync にラップする共通ヘルパー
 *
 * @example
 * ```ts
 * dbQuery(
 *   db.select().from(notes).where(eq(notes.id, id)),
 *   'Failed to find note'
 * )
 * ```
 */
export const dbQuery = <T>(query: Promise<T>, errorMessage: string): ResultAsync<T, NoteError> =>
  ResultAsync.fromPromise(query, (error) => databaseError(errorMessage, error));

/**
 * 単一結果を取得するヘルパー（配列の最初の要素を返す）
 *
 * @example
 * ```ts
 * dbQueryFirst(
 *   db.select().from(notes).where(eq(notes.id, id)),
 *   'Failed to find note'
 * )
 * ```
 */
export const dbQueryFirst = <T>(
  query: Promise<T[]>,
  errorMessage: string
): ResultAsync<T | undefined, NoteError> =>
  ResultAsync.fromPromise(
    query.then((results) => results[0]),
    (error) => databaseError(errorMessage, error)
  );
