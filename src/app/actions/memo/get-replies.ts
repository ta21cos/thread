'use server';

import { ResultAsync } from 'neverthrow';
import { MemoIdInput, MemoIdSchema } from './schema';
import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/generated/prisma';

/**
 * Get replies to a specific memo
 *
 * @param input - Object containing the memo ID
 * @returns Serializable result containing an array of replies or an error
 */
export async function getReplies(input: MemoIdInput): Promise<SerializableResult<Memo[]>> {
  // Validate with zod schema using safeParse
  const validation = MemoIdSchema.safeParse(input);

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
    MemoRepository.findReplies(validatedMemoId),
    (error) => {
      console.error('Error fetching replies:', error);
      return {
        message: 'Failed to fetch replies',
        cause: error,
      };
    }
  );

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
