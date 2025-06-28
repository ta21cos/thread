'use server';

import { cache } from 'react';
import { ResultAsync } from 'neverthrow';
import { SerializableResult } from '../memo/types';
import { toSerializable } from '../memo/utils';
import { MemoRepository } from '../../../lib/db';
import { Memo } from '@/lib/prisma/types';
import { z } from 'zod';

export interface ThreadData {
  parentMemo: Memo;
  replies: Memo[];
  totalReplies: number;
  participants: string[];
}

export interface ThreadSummary {
  memoId: string;
  replyCount: number;
  lastReplyAt: Date | null;
  participants: string[];
}

const ThreadIdSchema = z.object({
  memoId: z.string().min(1, 'Memo ID is required'),
});

// Using React cache() for request-level caching
const fetchThreadDataInternal = cache(async (memoId: string): Promise<ThreadData> => {
  // Fetch parent memo
  const allMemos = await MemoRepository.findAll();
  const parentMemo = allMemos.find((memo) => memo.id === memoId);

  if (!parentMemo) {
    throw new Error('Parent memo not found');
  }

  // Fetch all replies
  const replies = await MemoRepository.findReplies(memoId);

  // Get unique participants
  const participants = Array.from(
    new Set([parentMemo.user_id, ...replies.map((reply) => reply.user_id)])
  );

  return {
    parentMemo,
    replies,
    totalReplies: replies.length,
    participants,
  };
});

export async function getThreadData(input: {
  memoId: string;
}): Promise<SerializableResult<ThreadData>> {
  // Validate input
  const validation = ThreadIdSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      error: {
        message: 'Invalid memo ID',
        cause: validation.error.errors,
      },
    };
  }

  const { memoId } = validation.data;

  const result = await ResultAsync.fromPromise(fetchThreadDataInternal(memoId), (error) => {
    console.error('Error fetching thread data:', error);
    return {
      message: 'Failed to fetch thread data',
      cause: error,
    };
  });

  return toSerializable(result);
}

// Using React cache() for request-level caching
const fetchAllThreadSummariesInternal = cache(async (): Promise<ThreadSummary[]> => {
  const allMemos = await MemoRepository.findAll();
  const rootMemos = allMemos.filter((memo) => !memo.parent_id);

  const summaries = await Promise.all(
    rootMemos.map(async (memo) => {
      const replies = await MemoRepository.findReplies(memo.id);
      const participants = Array.from(
        new Set([memo.user_id, ...replies.map((reply) => reply.user_id)])
      );

      const lastReply =
        replies.length > 0
          ? replies.reduce((latest, reply) =>
              new Date(reply.created_at) > new Date(latest.created_at) ? reply : latest
            )
          : null;

      return {
        memoId: memo.id,
        replyCount: replies.length,
        lastReplyAt: lastReply ? new Date(lastReply.created_at) : null,
        participants,
      };
    })
  );

  return summaries;
});

export async function getThreadSummaries(): Promise<SerializableResult<ThreadSummary[]>> {
  const result = await ResultAsync.fromPromise(fetchAllThreadSummariesInternal(), (error) => {
    console.error('Error fetching thread summaries:', error);
    return {
      message: 'Failed to fetch thread summaries',
      cause: error,
    };
  });

  return toSerializable(result);
}

export async function getActiveThreads(
  limit: number = 10
): Promise<SerializableResult<ThreadSummary[]>> {
  const result = await getThreadSummaries();

  if (!result.success) {
    return result;
  }

  // Sort by last reply date and take the most active
  const activeThreads = result.data
    .filter((thread) => thread.replyCount > 0)
    .sort((a, b) => {
      if (!a.lastReplyAt) return 1;
      if (!b.lastReplyAt) return -1;
      return new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime();
    })
    .slice(0, limit);

  return {
    success: true,
    data: activeThreads,
  };
}
