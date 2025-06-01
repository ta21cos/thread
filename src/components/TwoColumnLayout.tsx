'use client';

import { Memo } from '@/lib/prisma/types';
import { MessageList } from './MessageList';
import { ThreadPanel } from './ThreadPanel';

interface TwoColumnLayoutProps {
  messages: Memo[];
  threads: Record<string, Memo[]>;
  selectedMessage: Memo | null;
  onCreateMessage: (content: string, parentId?: string) => Promise<void>;
  onEditMessage?: (memo: Memo) => void;
  onDeleteMessage?: (memoId: string) => void;
  onSelectMessage: (message: Memo) => void;
  onCloseThread: () => void;
}

export function TwoColumnLayout({
  messages,
  threads,
  selectedMessage,
  onCreateMessage,
  onEditMessage,
  onDeleteMessage,
  onSelectMessage,
  onCloseThread,
}: TwoColumnLayoutProps) {
  const selectedThreadReplies = selectedMessage ? threads[selectedMessage.id] || [] : [];

  return (
    <div className="h-screen flex">
      {/* Left column - Message list */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-base-300">
        <div className="p-4 border-b border-base-300 bg-base-100">
          <h2 className="text-lg font-semibold">メッセージ</h2>
          <p className="text-sm text-base-content/60">メッセージをクリックしてスレッドを表示</p>
        </div>

        <div className="flex-1 min-h-0">
          <MessageList
            messages={messages}
            threads={threads}
            onCreateMessage={onCreateMessage}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onSelectMessage={onSelectMessage}
            selectedMessageId={selectedMessage?.id}
          />
        </div>
      </div>

      {/* Right column - Thread panel */}
      <div className="w-1/2 min-w-0">
        <ThreadPanel
          selectedMessage={selectedMessage}
          threadReplies={selectedThreadReplies}
          onCreateMessage={onCreateMessage}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onClose={onCloseThread}
        />
      </div>
    </div>
  );
}
