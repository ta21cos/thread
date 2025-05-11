'use server';

import { ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError } from '@/lib/actions';
import { Memo } from '@/lib/db/schema';

/**
 * Get replies to a specific memo
 *
 * @param formData - FormData containing the memo ID
 * @returns ResultAsync containing an array of replies or an error
 */
export async function getReplies(formData: FormData): Promise<ResultAsync<Memo[], AppError>> {
  // Extract and validate the form data
  const memoId = formData.get('memoId')?.toString() || '';

  return ResultAsync.fromPromise(
    db
      .selectFrom('memos')
      .where('parent_id', '=', memoId)
      .orderBy('created_at', 'asc')
      .selectAll()
      .execute(),
    (error) => {
      console.error('Error fetching replies:', error);
      return {
        message: 'Failed to fetch replies',
        cause: error,
      };
    }
  );
}
