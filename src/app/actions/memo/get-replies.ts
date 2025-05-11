'use server';

import { errAsync, ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError, Memo, MemoIdSchema } from './schema';

/**
 * Get replies to a specific memo
 *
 * @param formData - FormData containing the memo ID
 * @returns ResultAsync containing an array of replies or an error
 */
export async function getReplies(formData: FormData): Promise<ResultAsync<Memo[], AppError>> {
  // Extract form data
  const memoId = formData.get('memoId')?.toString() || '';

  // Validate with zod schema using safeParse
  const validation = MemoIdSchema.safeParse({ memoId });

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return errAsync({
      message: 'Invalid memo ID',
      cause: validation.error.errors,
    });
  }

  // Validation succeeded, extract the validated memo ID
  const { memoId: validatedMemoId } = validation.data;

  // Execute the database operation
  return ResultAsync.fromPromise(
    db
      .selectFrom('memos')
      .where('parent_id', '=', validatedMemoId)
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
