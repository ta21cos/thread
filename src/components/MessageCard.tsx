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
      className={`chat ${isThread ? 'chat-start ml-12' : 'chat-start'} group hover:bg-base-200 px-4 py-2 rounded-lg transition-colors`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          <img src={`https://picsum.photos/40/40?random=${memo.user_id}`} alt="User avatar" />
        </div>
      </div>

      {/* Header with username and timestamp */}
      <div className="chat-header flex items-center gap-2 mb-1">
        <span className="font-semibold text-base-content">User {memo.user_id.slice(0, 8)}</span>
        <time className="text-xs text-base-content/60">{formatTime(memo.created_at)}</time>
      </div>

      {/* Message content */}
      <div className="chat-bubble chat-bubble-primary bg-transparent text-base-content p-0 shadow-none">
        <p className="whitespace-pre-wrap break-words">{memo.content}</p>
      </div>

      {/* Action buttons - show on hover */}
      {showActions && (
        <div className="chat-footer mt-2">
          <div className="flex gap-1">
            {!isThread && onReply && showReplyButton && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onReply(memo.id)}
                title="スレッドで返信"
              >
                💬
              </button>
            )}
            {onEdit && (
              <button className="btn btn-ghost btn-xs" onClick={() => onEdit(memo)} title="編集">
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onDelete(memo.id)}
                title="削除"
              >
                🗑️
              </button>
            )}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                ⋯
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-32 p-2 shadow"
              >
                <li>
                  <a>リンクをコピー</a>
                </li>
                <li>
                  <a>ブックマーク</a>
                </li>
                <li>
                  <a>報告</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
