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
      <div className="flex-1 overflow-y-auto px-lg py-md space-y-xs">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-lg animate-fade-in">💬</div>
            <h3 className="text-lg font-semibold mb-sm text-base-content">
              まだメッセージがありません
            </h3>
            <p className="text-base-content/60 text-sm">最初のメッセージを投稿してみましょう！</p>
          </div>
        ) : (
          messages.map((message) => {
            const threadCount = threads[message.id]?.length || 0;
            const isSelected = selectedMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`
                  group cursor-pointer transition-all duration-200 ease-out rounded-lg
                  ${
                    isSelected
                      ? 'bg-primary/10 border-l-4 border-primary shadow-sm'
                      : 'hover:bg-base-200/70 border-l-4 border-transparent'
                  }
                `}
                onClick={() => onSelectMessage?.(message)}
              >
                {/* Main message */}
                <div className="pl-sm">
                  <MessageCard
                    memo={message}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                    showReplyButton={false}
                  />
                </div>

                {/* Thread indicator */}
                {threadCount > 0 && (
                  <div className="ml-2xl mb-sm pl-sm">
                    <div className="flex items-center gap-sm text-sm text-primary hover:text-primary-focus transition-colors">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
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
                      <span className="font-medium">{threadCount}件の返信</span>
                      <span className="text-base-content/40">•</span>
                      <span className="text-xs text-base-content/60">スレッドを表示</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Main message input */}
      <div className="border-t border-base-300 px-lg py-lg bg-base-100">
        <MessageInput
          onSubmitAction={(content) => createMessageAction(content)}
          placeholder="メッセージを入力..."
        />
      </div>
    </div>
  );
}
