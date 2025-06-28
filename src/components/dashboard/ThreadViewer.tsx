'use client';

import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getThreadData } from '@/app/actions/thread/get-thread-data';
import { ThreadPanel } from '@/components/ThreadPanel';
import { Memo } from '@/lib/prisma/types';

interface ThreadViewerProps {
  selectedMessage: Memo;
  onClose: () => void;
  onCreateReply: (content: string, parentId: string) => Promise<void>;
}

export function ThreadViewer({ selectedMessage, onClose, onCreateReply }: ThreadViewerProps) {
  const threadData = useSuspenseQuery(['thread-data', selectedMessage.id], async () => {
    const result = await getThreadData({ memoId: selectedMessage.id });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ThreadPanel
          selectedMessage={threadData.parentMemo}
          threadReplies={threadData.replies}
          onClose={onClose}
          createMessageAction={(content: string) => onCreateReply(content, selectedMessage.id)}
        />
      </div>

      {/* Thread Stats */}
      <div className="p-2 bg-base-200 border-t text-xs text-base-content/60">
        <div className="flex justify-between">
          <span>{threadData.totalReplies} replies</span>
          <span>{threadData.participants.length} participants</span>
        </div>
      </div>
    </div>
  );
}
