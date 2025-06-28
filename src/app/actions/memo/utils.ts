'use server';

import { Result, ResultAsync } from 'neverthrow';
import { SerializableResult } from './types';

/**
 * Convert a ResultAsync to a serializable result for safe client consumption
 *
 * @param result ResultAsync or Result from server action
 * @returns SerializableResult that can be safely passed to clients
 */
export async function toSerializable<T, E extends { message: string; cause?: unknown }>(
  result: ResultAsync<T, E> | Result<T, E>
): Promise<SerializableResult<T>> {
  // Handle both ResultAsync and Result types
  if ('_promise' in result) {
    // It's ResultAsync
    return result.match(
      // On success
      (data) => ({
        success: true,
        data,
      }),
      // On error
      (error) => ({
        success: false,
        error: {
          message: error.message,
          cause: error.cause,
        },
      })
    );
  } else {
    // It's Result
    return result.match(
      // On success
      (data) => ({
        success: true,
        data,
      }),
      // On error
      (error) => ({
        success: false,
        error: {
          message: error.message,
          cause: error.cause,
        },
      })
    );
  }
}
