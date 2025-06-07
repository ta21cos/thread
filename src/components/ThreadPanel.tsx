'use client';

import { Memo } from '@/lib/prisma/types';
import { MessageCard } from './MessageCard';
import { MessageInput } from './MessageInput';

interface ThreadPanelProps {
  selectedMessage: Memo | null;
  threadReplies: Memo[];
  onCreateMessage: (content: string, parentId?: string) => Promise<void>;
  onEditMessage?: (memo: Memo) => void;
  onDeleteMessage?: (memoId: string) => void;
  onClose: () => void;
}

export function ThreadPanel({
  selectedMessage,
  threadReplies,
  onCreateMessage,
  onEditMessage,
  onDeleteMessage,
  onClose,
}: ThreadPanelProps) {
  if (!selectedMessage) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100 border-l border-base-300">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">スレッドを選択</h3>
          <p className="text-base-content/60">左側のメッセージをクリックしてスレッドを表示</p>
        </div>
      </div>
    );
  }

  const handleThreadSubmit = async (content: string) => {
    await onCreateMessage(content, selectedMessage.id);
  };

  return (
    <div className="h-full flex flex-col bg-base-100 border-l border-base-300">
      {/* Thread header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-50">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">スレッド</h3>
          <span className="badge badge-primary">{threadReplies.length}件の返信</span>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="スレッドを閉じる"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto">
        {/* Original message */}
        <div className="p-4 bg-base-50 border-b border-base-300">
          <div className="mb-2">
            <span className="text-sm font-medium text-base-content/70">元のメッセージ</span>
          </div>
          <MessageCard
            memo={selectedMessage}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            isThread={false}
            showReplyButton={false}
          />
        </div>

        {/* Thread replies */}
        <div className="p-4 space-y-3">
          {threadReplies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🧵</div>
              <p className="text-base-content/60">
                まだ返信がありません。最初の返信を投稿してみましょう！
              </p>
            </div>
          ) : (
            threadReplies.map((reply) => (
              <MessageCard
                key={reply.id}
                memo={reply}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                isThread={false}
                showReplyButton={false}
              />
            ))
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className="border-t border-base-300 p-4 bg-base-100">
        <div className="mb-2">
          <span className="text-sm text-base-content/60">
            User {selectedMessage.user_id.slice(0, 8)} のスレッドに返信
          </span>
        </div>
        <MessageInput
          onSubmit={handleThreadSubmit}
          placeholder="スレッドで返信..."
          isThread={true}
          parentId={selectedMessage.id}
        />
      </div>
    </div>
  );
}
