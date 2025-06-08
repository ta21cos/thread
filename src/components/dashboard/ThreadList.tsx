'use client';

import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getReplies } from '@/app/actions/memo/get-replies';
import { Memo } from '@/lib/prisma/types';

interface ThreadListProps {
  memoIds: string[];
}

export function ThreadList({ memoIds }: ThreadListProps) {
  const threadsData = useSuspenseQuery(['threads', memoIds], async () => {
    const threads: Record<string, Memo[]> = {};

    for (const memoId of memoIds) {
      const repliesResult = await getReplies({ memoId });
      if (repliesResult.success) {
        threads[memoId] = repliesResult.data;
      }
    }

    return threads;
  });

  return threadsData;
}
