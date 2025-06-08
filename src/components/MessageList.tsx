'use client';

import React from 'react';
import { Memo } from '@/lib/prisma/types';
import { MessageCard } from './MessageCard';
import { MessageInput } from './MessageInput';

interface MessageListProps {
  messages: Memo[];
  createMessageAction: (content: string, parentId?: string) => Promise<void>;
  onEditMessage?: (memo: Memo) => void;
  onDeleteMessage?: (memoId: string) => void;
  threads?: Record<string, Memo[]>; // parentId -> replies
  onSelectMessage?: (message: Memo) => void;
  selectedMessageId?: string | null;
}

export function MessageList({
  messages,
  createMessageAction,
  onEditMessage,
  onDeleteMessage,
  threads = {},
  onSelectMessage,
  selectedMessageId,
}: MessageListProps) {
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
            const threadCount = threads[message.id]?.length || 0;
            const isSelected = selectedMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`group cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-base-200'
                }`}
                onClick={() => onSelectMessage?.(message)}
              >
                {/* Main message */}
                <MessageCard
                  memo={message}
                  onEdit={onEditMessage}
                  onDelete={onDeleteMessage}
                  showReplyButton={false}
                />

                {/* Thread indicator */}
                {threadCount > 0 && (
                  <div className="ml-14 mb-2">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <svg
                        className="w-4 h-4"
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
                    </div>
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
          onSubmitAction={(content) => createMessageAction(content)}
          placeholder="メッセージを入力..."
        />
      </div>
    </div>
  );
}
