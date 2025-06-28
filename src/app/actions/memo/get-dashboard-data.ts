'use server';

import { cache } from 'react';
import { ResultAsync } from 'neverthrow';
import { SerializableResult } from './types';
import { toSerializable } from './utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/lib/prisma/types';
import { sleep } from '@/lib/sleep';

export interface DashboardData {
  memos: Memo[];
  threads: Record<string, Memo[]>;
  totalMessages: number;
  totalThreads: number;
}

// Using React cache() for request-level caching
const fetchDashboardDataInternal = cache(async (): Promise<DashboardData> => {
  // Fetch all root memos (no parent)
  const memos = await MemoRepository.findAll();
  const rootMemos = memos.filter((memo) => !memo.parent_id);

  // Fetch threads for each root memo in parallel
  const threadsPromises = rootMemos.map(async (memo) => {
    const replies = await MemoRepository.findReplies(memo.id);
    return { memoId: memo.id, replies };
  });

  const threadsResults = await Promise.all(threadsPromises);

  // Build threads object
  const threads: Record<string, Memo[]> = {};
  let totalThreads = 0;

  threadsResults.forEach(({ memoId, replies }) => {
    threads[memoId] = replies;
    if (replies.length > 0) {
      totalThreads++;
    }
  });

  sleep(2000);

  return {
    memos: rootMemos,
    threads,
    totalMessages: memos.length,
    totalThreads,
  };
});

export async function getDashboardData(): Promise<SerializableResult<DashboardData>> {
  const functionsWithSleep = async () => {
    await sleep(3000);
    return await fetchDashboardDataInternal();
  };

  const result = await ResultAsync.fromPromise(functionsWithSleep(), (error) => {
    console.error('Error fetching dashboard data:', error);
    return {
      message: 'Failed to fetch dashboard data',
      cause: error,
    };
  });

  return toSerializable(result);
}
