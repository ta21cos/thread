'use client';

import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getMemos } from '@/app/actions/memo/get';
import { MessageCard } from '@/components/MessageCard';
import { Memo } from '@/lib/prisma/types';

interface MemoListProps {
  onSelectMessage: (message: Memo) => void;
  onEditMessage: (memo: Memo) => void;
  onDeleteMessage: (memoId: string) => void;
  threads: Record<string, Memo[]>;
}

export function MemoList({
  onSelectMessage,
  onEditMessage,
  onDeleteMessage,
  threads,
}: MemoListProps) {
  const memosResult = useSuspenseQuery(['memos'], async () => {
    const result = await getMemos();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data.filter((memo) => !memo.parent_id);
  });

  return (
    <div className="space-y-4">
      {memosResult.map((memo) => (
        <MessageCard key={memo.id} memo={memo} onEdit={onEditMessage} onDelete={onDeleteMessage} />
      ))}
      {memosResult.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          <p>No messages yet. Start a conversation!</p>
        </div>
      )}
    </div>
  );
}
