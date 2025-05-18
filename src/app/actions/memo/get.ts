'use server';

import { ResultAsync } from 'neverthrow';

import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/generated/prisma';

/**
 * Get all memos (root level, no parent)
 *
 * @returns Serializable result containing an array of memos or an error
 */
export async function getMemos(): Promise<SerializableResult<Memo[]>> {
  // Execute the database operation using our MemoRepository
  const result = await ResultAsync.fromPromise(MemoRepository.findAll(), (error) => {
    console.error('Error fetching memos:', error);
    return {
      message: 'Failed to fetch memos',
      cause: error,
    };
  });

  // Convert ResultAsync to SerializableResult
  return toSerializable(result);
}
