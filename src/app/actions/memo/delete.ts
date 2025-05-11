'use server';

import { revalidatePath } from 'next/cache';
import { errAsync, ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError, MemoIdSchema } from './schema';

/**
 * Delete a memo and all its replies
 *
 * @param formData - FormData containing the memo ID
 * @returns ResultAsync containing void or an error
 */
export async function deleteMemo(formData: FormData): Promise<ResultAsync<void, AppError>> {
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
    // First delete all replies
    db
      .deleteFrom('memos')
      .where('parent_id', '=', validatedMemoId)
      .execute()
      .then(() => {
        // Then delete the memo itself
        return db.deleteFrom('memos').where('id', '=', validatedMemoId).execute();
      })
      .then(() => {
        // Revalidate the path to update the UI
        revalidatePath('/dashboard');
      }),
    (error) => {
      console.error('Error deleting memo:', error);
      return {
        message: 'Failed to delete memo',
        cause: error,
      };
    }
  );
}
