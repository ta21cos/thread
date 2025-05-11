'use server';

import { revalidatePath } from 'next/cache';
import { errAsync, ResultAsync } from 'neverthrow';
import { db } from '../../../lib/db';
import { NewMemoSchema, AppError, Memo } from './schema';

/**
 * Create a new memo
 *
 * @param formData - FormData from the client
 * @returns ResultAsync containing the created memo or an error
 */
export async function createMemo(formData: FormData): Promise<ResultAsync<Memo, AppError>> {
  // Extract form data
  const content = formData.get('content')?.toString() || '';
  const user_id = formData.get('user_id')?.toString() || '';
  const parent_id = formData.get('parent_id')?.toString() || null;

  // Validate with zod schema using safeParse
  const validation = NewMemoSchema.safeParse({
    content,
    user_id,
    parent_id: parent_id || null,
  });

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return errAsync({
      message: 'Invalid input data',
      cause: validation.error.errors,
    });
  }

  // Validation succeeded, extract the validated data
  const validatedData = validation.data;

  // Execute the database operation
  return ResultAsync.fromPromise(
    db
      .insertInto('memos')
      .values({
        content: validatedData.content,
        user_id: validatedData.user_id,
        parent_id: validatedData.parent_id,
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
