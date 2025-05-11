'use server';

import { revalidatePath } from 'next/cache';
import { ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { AppError } from '@/lib/actions';
import { Memo } from '@/lib/db/schema';

/**
 * Create a new memo
 *
 * @param formData - FormData from the client
 * @returns ResultAsync containing the created memo or an error
 */
export async function createMemo(formData: FormData): Promise<ResultAsync<Memo, AppError>> {
  // Extract and validate the form data
  const content = formData.get('content')?.toString() || '';
  const user_id = formData.get('user_id')?.toString() || '';
  const parent_id = formData.get('parent_id')?.toString() || null;

  // Execute the database operation
  return ResultAsync.fromPromise(
    db
      .insertInto('memos')
      .values({
        content,
        user_id,
        parent_id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
      .then((result) => {
        // Revalidate the path to update the UI
        revalidatePath('/dashboard');
        return result;
      }),
    (error) => {
      console.error('Error creating memo:', error);
      return {
        message: 'Failed to create memo',
        cause: error,
      };
    }
  );
}
