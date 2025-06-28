'use client';

import { useState } from 'react';
import { Memo } from '@/lib/prisma/types';

interface MessageCardProps {
  memo: Memo;
  onReply?: (parentId: string) => void;
  onEdit?: (memo: Memo) => void;
  onDelete?: (memoId: string) => void;
  isThread?: boolean;
  showReplyButton?: boolean;
}

export function MessageCard({
  memo,
  onReply,
  onEdit,
  onDelete,
  isThread = false,
  showReplyButton = true,
}: MessageCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (date: string | Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return messageDate.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div
      className={`
        chat chat-start group relative min-h-message-card
        ${isThread ? 'ml-3xl' : ''} 
        px-lg py-md rounded-lg 
        transition-all duration-150 ease-out
        hover:bg-base-200/50
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar - Fixed size container */}
      <div className="chat-image avatar flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-base-300 overflow-hidden">
          <img
            src={`https://picsum.photos/40/40?random=${memo.user_id}`}
            alt="User avatar"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {/* Header with username and timestamp */}
      <div className="chat-header flex items-center gap-sm mb-xs">
        <span className="font-semibold text-base-content text-sm">
          User {memo.user_id.slice(0, 8)}
        </span>
        <time className="text-xs text-base-content/60 flex-shrink-0">
          {formatTime(memo.created_at)}
        </time>
      </div>

      {/* Message content */}
      <div className="chat-bubble chat-bubble-primary bg-transparent text-base-content p-0 shadow-none">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{memo.content}</p>
      </div>

      {/* Action buttons - Fixed height container to prevent layout shift */}
      <div className="chat-footer mt-sm h-6">
        <div
          className={`
          flex gap-xs transition-all duration-150 ease-out
          ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}
        `}
        >
          {!isThread && onReply && showReplyButton && (
            <button
              className="btn btn-ghost btn-xs hover:bg-base-300"
              onClick={() => onReply(memo.id)}
              title="スレッドで返信"
            >
              💬
            </button>
          )}
          {onEdit && (
            <button
              className="btn btn-ghost btn-xs hover:bg-base-300"
              onClick={() => onEdit(memo)}
              title="編集"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-ghost btn-xs hover:bg-base-300"
              onClick={() => onDelete(memo.id)}
              title="削除"
            >
              🗑️
            </button>
          )}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs hover:bg-base-300">
              ⋯
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-lg z-[1] w-32 p-sm shadow-lg border border-base-300 max-h-dropdown overflow-y-auto animate-fade-in"
            >
              <li>
                <a className="text-sm hover:bg-base-200">リンクをコピー</a>
              </li>
              <li>
                <a className="text-sm hover:bg-base-200">ブックマーク</a>
              </li>
              <li>
                <a className="text-sm hover:bg-base-200">報告</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
