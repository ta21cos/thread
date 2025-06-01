'use client';

import { useState } from 'react';
import { Memo } from '@/lib/prisma/types';
import { MessageCard } from './MessageCard';
import { MessageInput } from './MessageInput';

interface MessageListProps {
  messages: Memo[];
  onCreateMessage: (content: string, parentId?: string) => Promise<void>;
  onEditMessage?: (memo: Memo) => void;
  onDeleteMessage?: (memoId: string) => void;
  threads?: Record<string, Memo[]>; // parentId -> replies
}

export function MessageList({
  messages,
  onCreateMessage,
  onEditMessage,
  onDeleteMessage,
  threads = {},
}: MessageListProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const toggleThread = (messageId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setExpandedThreads((prev) => new Set(prev).add(parentId));
  };

  const handleThreadSubmit = async (content: string) => {
    if (replyingTo) {
      await onCreateMessage(content, replyingTo);
      setReplyingTo(null);
    }
  };

  const getThreadCount = (messageId: string) => {
    return threads[messageId]?.length || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold mb-2">まだメッセージがありません</h3>
            <p className="text-base-content/60">最初のメッセージを投稿してみましょう！</p>
          </div>
        ) : (
          messages.map((message) => {
            const threadReplies = threads[message.id] || [];
            const threadCount = threadReplies.length;
            const isExpanded = expandedThreads.has(message.id);

            return (
              <div key={message.id} className="group">
                {/* Main message */}
                <MessageCard
                  memo={message}
                  onReply={handleReply}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                />

                {/* Thread indicator */}
                {threadCount > 0 && (
                  <div className="ml-14 mb-2">
                    <button
                      onClick={() => toggleThread(message.id)}
                      className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {threadCount}件の返信
                      {isExpanded ? (
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

                {/* Thread replies */}
                {isExpanded && threadReplies.length > 0 && (
                  <div className="ml-4 border-l-2 border-base-300 pl-4 space-y-1">
                    {threadReplies.map((reply) => (
                      <MessageCard
                        key={reply.id}
                        memo={reply}
                        onEdit={onEditMessage}
                        onDelete={onDeleteMessage}
                        isThread={true}
                      />
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === message.id && (
                  <div className="ml-4 border-l-2 border-primary pl-4">
                    <div className="mb-2">
                      <span className="text-sm text-base-content/60">
                        User {message.user_id.slice(0, 8)} への返信
                      </span>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="btn btn-ghost btn-xs ml-2"
                      >
                        キャンセル
                      </button>
                    </div>
                    <MessageInput
                      onSubmit={handleThreadSubmit}
                      placeholder="スレッドで返信..."
                      isThread={true}
                      parentId={message.id}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Main message input */}
      <div className="border-t border-base-300 p-4 bg-base-100">
        <MessageInput
          onSubmit={(content) => onCreateMessage(content)}
          placeholder="メッセージを入力..."
        />
      </div>
    </div>
  );
}
