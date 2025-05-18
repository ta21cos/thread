'use server';

import { revalidatePath } from 'next/cache';
import { ResultAsync } from 'neverthrow';
import { MemoIdSchema } from './schema';
import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';

/**
 * Delete a memo and all its replies
 *
 * @param formData - FormData containing the memo ID
 * @returns Serializable result indicating success or failure
 */
export async function deleteMemo(formData: FormData): Promise<SerializableResult<void>> {
  // Extract form data
  const memoId = formData.get('memoId')?.toString() || '';

  // Validate with zod schema using safeParse
  const validation = MemoIdSchema.safeParse({ memoId });

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return {
      success: false,
      error: {
        message: 'Invalid memo ID',
        cause: validation.error.errors,
      },
    };
  }

  // Validation succeeded, extract the validated memo ID
  const { memoId: validatedMemoId } = validation.data;

  // Execute the database operation using our MemoRepository
  const result = await ResultAsync.fromPromise(
    MemoRepository.delete(validatedMemoId).then(() => {
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

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
