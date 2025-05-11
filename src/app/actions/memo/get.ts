'use server';

import { ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError, Memo } from './schema';

/**
 * Get all memos (root level, no parent)
 *
 * @returns ResultAsync containing an array of memos or an error
 */
export async function getMemos(): Promise<ResultAsync<Memo[], AppError>> {
  // Execute the database operation
  return ResultAsync.fromPromise(
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
}
