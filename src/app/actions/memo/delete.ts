'use server';

import { revalidatePath } from 'next/cache';
import { ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError } from '@/lib/actions';

/**
 * Delete a memo and all its replies
 *
 * @param formData - FormData containing the memo ID
 * @returns ResultAsync containing void or an error
 */
export async function deleteMemo(formData: FormData): Promise<ResultAsync<void, AppError>> {
  // Extract and validate the form data
  const memoId = formData.get('memoId')?.toString() || '';

  return ResultAsync.fromPromise(
    // First delete all replies
    db
      .deleteFrom('memos')
      .where('parent_id', '=', memoId)
      .execute()
      .then(() => {
        // Then delete the memo itself
        return db.deleteFrom('memos').where('id', '=', memoId).execute();
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
