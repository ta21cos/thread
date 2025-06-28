'use client';

import { Memo } from '@/lib/prisma/types';
import { MessageCard } from './MessageCard';
import { MessageInput } from './MessageInput';

interface ThreadPanelProps {
  selectedMessage: Memo | null;
  threadReplies: Memo[];
  createMessageAction: (content: string, parentId?: string) => Promise<void>;
  onEditMessage?: (memo: Memo) => void;
  onDeleteMessage?: (memoId: string) => void;
  onClose: () => void;
}

export function ThreadPanel({
  selectedMessage,
  threadReplies,
  createMessageAction,
  onEditMessage,
  onDeleteMessage,
  onClose,
}: ThreadPanelProps) {
  if (!selectedMessage) {
    return (
      <div className="h-full flex items-center justify-center bg-base-100 border-l border-base-300">
        <div className="text-center px-xl">
          <div className="text-6xl mb-lg animate-fade-in">💬</div>
          <h3 className="text-lg font-semibold mb-sm text-base-content">スレッドを選択</h3>
          <p className="text-base-content/60 text-sm">
            左側のメッセージをクリックしてスレッドを表示
          </p>
        </div>
      </div>
    );
  }

  const handleThreadSubmit = async (content: string) => {
    await createMessageAction(content, selectedMessage.id);
  };

  return (
    <div className="h-full flex flex-col bg-base-100 border-l border-base-300">
      {/* Thread header */}
      <div className="flex items-center justify-between px-xl py-lg border-b border-base-300 bg-base-50">
        <div className="flex items-center gap-md">
          <h3 className="text-lg font-semibold text-base-content">スレッド</h3>
          <span className="badge badge-primary text-xs px-sm py-xs">
            {threadReplies.length}件の返信
          </span>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors"
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
        <div className="px-xl py-lg bg-base-50 border-b border-base-300">
          <div className="mb-sm">
            <span className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
              元のメッセージ
            </span>
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
        <div className="px-xl py-lg space-y-md">
          {threadReplies.length === 0 ? (
            <div className="text-center py-3xl">
              <div className="text-4xl mb-md animate-fade-in">🧵</div>
              <p className="text-base-content/60 text-sm">
                まだ返信がありません。最初の返信を投稿してみましょう！
              </p>
            </div>
          ) : (
            threadReplies.map((reply) => (
              <div key={reply.id} className="animate-slide-up">
                <MessageCard
                  memo={reply}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  isThread={false}
                  showReplyButton={false}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className="border-t border-base-300 px-xl py-lg bg-base-100">
        <div className="mb-sm">
          <span className="text-sm text-base-content/60">
            User {selectedMessage.user_id.slice(0, 8)} のスレッドに返信
          </span>
        </div>
        <MessageInput
          onSubmitAction={handleThreadSubmit}
          placeholder="スレッドで返信..."
          isThread={true}
        />
      </div>
    </div>
  );
}
