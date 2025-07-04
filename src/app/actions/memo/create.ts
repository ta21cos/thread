'use server';

import { revalidatePath } from 'next/cache';
import { ResultAsync } from 'neverthrow';
import { NewMemoInput, NewMemoSchema } from './schema';
import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/lib/prisma/types';
import { invalidateAllMemoData } from '../cache';

/**
 * Create a new memo
 *
 * @param formData - FormData from the client
 * @returns A serializable result containing the created memo or an error
 */
export async function createMemo(memo: NewMemoInput): Promise<SerializableResult<Memo>> {
  const { content, user_id, parent_id } = memo;

  // Validate with zod schema using safeParse
  const validation = NewMemoSchema.safeParse({
    content,
    user_id,
    parent_id: parent_id || null,
  });

  // If validation failed, return error result
  if (!validation.success) {
    console.error('Validation error:', validation.error.errors);
    return {
      success: false,
      error: {
        message: 'Invalid input data',
        cause: validation.error.errors,
      },
    };
  }

  // Validation succeeded, extract the validated data
  const validatedData = validation.data;

  // Execute the database operation using our MemoRepository
  const result = await ResultAsync.fromPromise(
    MemoRepository.create({
      content: validatedData.content,
      user_id: validatedData.user_id,
      parent_id: validatedData.parent_id || null,
    }).then(async (result) => {
      // Revalidate the path to update the UI
      revalidatePath('/dashboard');
      // Invalidate all memo-related cache
      await invalidateAllMemoData();
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

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
