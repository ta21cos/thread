'use server';

import { ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError, Memo } from './schema';
import { SerializableResult } from './types';
import { toSerializable } from './utils';

/**
 * Get all memos (root level, no parent)
 *
 * @returns Serializable result containing an array of memos or an error
 */
export async function getMemos(): Promise<SerializableResult<Memo[]>> {
  // Execute the database operation
  const result = await ResultAsync.fromPromise(
    db
      .selectFrom('memos')
      .where('parent_id', 'is', null)
      .orderBy('created_at', 'desc')
      .selectAll()
      .execute(),
    (error) => {
      console.error('Error fetching memos:', error);
      return {
        message: 'Failed to fetch memos',
        cause: error,
      };
    }
  );

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
