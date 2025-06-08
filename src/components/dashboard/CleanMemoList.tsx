'use client';

import { MessageCard } from '@/components/MessageCard';
import { Memo } from '@/lib/prisma/types';

interface CleanMemoListProps {
  memos: Memo[];
  threads: Record<string, Memo[]>;
  onSelectMessage: (message: Memo) => void;
  onEditMessage: (memo: Memo) => void;
  onDeleteMessage: (memoId: string) => void;
}

export function CleanMemoList({
  memos,
  threads,
  onSelectMessage,
  onEditMessage,
  onDeleteMessage,
}: CleanMemoListProps) {
  return (
    <div className="space-y-4">
      {memos.map((memo) => (
        <MessageCard key={memo.id} memo={memo} onEdit={onEditMessage} onDelete={onDeleteMessage} />
      ))}
      {memos.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          <p>No messages yet. Start a conversation!</p>
        </div>
      )}
    </div>
  );
}
