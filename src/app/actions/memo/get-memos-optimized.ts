'use server';

import { cache } from 'react';
import { ResultAsync } from 'neverthrow';
import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/lib/prisma/types';

export interface GetMemosOptions {
  includeReplies?: boolean;
  limit?: number;
  offset?: number;
  parentId?: string | null;
}

// Using React cache() for request-level caching
const fetchMemosInternal = cache(async (options: GetMemosOptions = {}): Promise<Memo[]> => {
  const { includeReplies = false, limit, offset, parentId } = options;

  // Fetch all memos first
  const allMemos = await MemoRepository.findAll();

  // Filter based on parentId
  let filteredMemos =
    parentId === undefined
      ? allMemos.filter((memo) => !memo.parent_id) // Root memos only
      : parentId === null
        ? allMemos.filter((memo) => !memo.parent_id) // Explicitly root memos
        : allMemos.filter((memo) => memo.parent_id === parentId); // Specific parent

  // Apply pagination
  if (offset !== undefined) {
    filteredMemos = filteredMemos.slice(offset);
  }

  if (limit !== undefined) {
    filteredMemos = filteredMemos.slice(0, limit);
  }

  // Include replies if requested
  if (includeReplies && parentId === undefined) {
    // For root memos, attach their immediate replies
    const memosWithReplies = await Promise.all(
      filteredMemos.map(async (memo) => {
        const replies = await MemoRepository.findReplies(memo.id);
        return {
          ...memo,
          replies: replies.slice(0, 3), // Limit to first 3 replies for preview
          replyCount: replies.length,
        };
      })
    );
    return memosWithReplies;
  }

  return filteredMemos;
});

export async function getMemosOptimized(
  options: GetMemosOptions = {}
): Promise<SerializableResult<Memo[]>> {
  const result = await ResultAsync.fromPromise(fetchMemosInternal(options), (error) => {
    console.error('Error fetching optimized memos:', error);
    return {
      message: 'Failed to fetch memos',
      cause: error,
    };
  });

  return toSerializable(result);
}

export async function getRootMemos(): Promise<SerializableResult<Memo[]>> {
  return getMemosOptimized({ parentId: null });
}

export async function getRecentMemos(limit: number = 10): Promise<SerializableResult<Memo[]>> {
  return getMemosOptimized({ limit, parentId: null });
}

export async function getMemosWithPagination(
  page: number = 1,
  pageSize: number = 10
): Promise<SerializableResult<Memo[]>> {
  const offset = (page - 1) * pageSize;
  return getMemosOptimized({
    limit: pageSize,
    offset,
    parentId: null,
  });
}
