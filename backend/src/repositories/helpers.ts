/**
 * Repository Helpers
 *
 * リポジトリ共通のユーティリティ関数。
 */

import { ResultAsync, okAsync, errAsync } from 'neverthrow';
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

/**
 * INSERT ... RETURNING の単一結果を取得するヘルパー
 * `.returning().then(([created]) => created)` パターンを簡略化
 *
 * @example
 * ```ts
 * dbInsertReturning(
 *   db.insert(notes).values(note).returning(),
 *   'Failed to create note'
 * )
 * ```
 */
export const dbInsertReturning = <T>(
  query: Promise<T[]>,
  errorMessage: string
): ResultAsync<T, NoteError> =>
  ResultAsync.fromPromise(
    query.then((results) => results[0]),
    (error) => databaseError(errorMessage, error)
  );

/**
 * UPDATE ... RETURNING の単一結果を取得するヘルパー
 * dbInsertReturning と同じだが、セマンティクスを明確にするためのエイリアス
 */
export const dbUpdateReturning = dbInsertReturning;

/**
 * DELETE クエリの結果を void に変換するヘルパー
 * `.then(() => undefined)` パターンを簡略化
 *
 * @example
 * ```ts
 * dbDelete(
 *   db.delete(notes).where(eq(notes.id, id)),
 *   'Failed to delete note'
 * )
 * ```
 */
export const dbDelete = (
  query: Promise<unknown>,
  errorMessage: string
): ResultAsync<void, NoteError> =>
  ResultAsync.fromPromise(
    query.then(() => undefined),
    (error) => databaseError(errorMessage, error)
  );

/**
 * エンティティの存在を確認するカリー化されたヘルパー
 * 見つからない場合はエラーを返す
 *
 * @example
 * ```ts
 * const ensureChannelExists = ensureExists(channelNotFoundError);
 * channelRepo.findById(id).andThen(ensureChannelExists(id));
 * ```
 */
export const ensureExists =
  <T>(notFoundError: (id: string) => NoteError) =>
  (id: string) =>
  (entity: T | undefined): ResultAsync<T, NoteError> =>
    entity ? okAsync(entity) : errAsync(notFoundError(id));

/**
 * 既存のエンティティを返すか、なければ作成するヘルパー
 * Upsert パターンのための共通ヘルパー
 *
 * @example
 * ```ts
 * scratchPadRepo.findByAuthorAndChannel(authorId, channelId)
 *   .andThen(getOrCreate(() => scratchPadRepo.create({ ... })));
 * ```
 */
export const getOrCreate =
  <T>(createFn: () => ResultAsync<T, NoteError>) =>
  (existing: T | undefined): ResultAsync<T, NoteError> =>
    existing ? okAsync(existing) : createFn();
