'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createMemo } from '@/app/actions/memo/create';
import { NewMemoInput } from '@/app/actions/memo/schema';
import { Memo } from '@/lib/prisma/types';
import { SlackLayout } from '@/components/SlackLayout';
import { SuspenseWrapper } from '@/components/suspense/SuspenseWrapper';
import {
  MessageListLoadingFallback,
  ThreadLoadingFallback,
  CompactLoadingFallback,
} from '@/components/suspense/LoadingFallbacks';
import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getMemos } from '@/app/actions/memo/get';
import { getReplies } from '@/app/actions/memo/get-replies';
import { invalidateQuery } from '@/hooks/useSuspenseQuery';
import { MessageInput } from '@/components/MessageInput';
import { MessageList } from '@/components/MessageList';
import { ThreadPanel } from '@/components/ThreadPanel';

function MemoListSection({
  onSelectMessage,
  createMessageAction,
}: {
  onSelectMessage: (memo: Memo) => void;
  createMessageAction: (content: string, parentId?: string) => Promise<void>;
}) {
  const memos = useSuspenseQuery(['memos'], async () => {
    const result = await getMemos();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data.filter((memo) => !memo.parent_id);
  });

  return (
    <div className="flex-1 overflow-hidden">
      <SuspenseWrapper
        fallback={<CompactLoadingFallback />}
        errorFallback={({ resetErrorBoundary }) => (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-2">Failed to load threads</p>
            <button onClick={resetErrorBoundary} className="btn btn-sm btn-primary">
              Retry
            </button>
          </div>
        )}
      >
        <ThreadProvider memoIds={memos.map((m) => m.id)}>
          <MessageList
            messages={memos}
            createMessageAction={createMessageAction}
            onSelectMessage={onSelectMessage}
            onEditMessage={() => {}}
            onDeleteMessage={() => {}}
          />
        </ThreadProvider>
      </SuspenseWrapper>
    </div>
  );
}

function ThreadProvider({ memoIds, children }: { memoIds: string[]; children: React.ReactNode }) {
  useSuspenseQuery(['threads', memoIds], async () => {
    const threadsData: Record<string, Memo[]> = {};

    for (const memoId of memoIds) {
      const repliesResult = await getReplies({ memoId });
      if (repliesResult.success) {
        threadsData[memoId] = repliesResult.data;
      }
    }

    return threadsData;
  });

  return <>{children}</>;
}

function ThreadSection({
  selectedMessage,
  onClose,
  onCreateReply,
}: {
  selectedMessage: Memo | null;
  onClose: () => void;
  onCreateReply: (content: string, parentId?: string) => Promise<void>;
}) {
  if (!selectedMessage) return null;

  return (
    <SuspenseWrapper
      fallback={<ThreadLoadingFallback />}
      errorFallback={({ resetErrorBoundary }) => (
        <div className="p-4 text-center">
          <p className="text-red-500 mb-2">Failed to load thread</p>
          <button onClick={resetErrorBoundary} className="btn btn-sm btn-primary">
            Retry
          </button>
        </div>
      )}
    >
      <ThreadContent
        selectedMessage={selectedMessage}
        onClose={onClose}
        onCreateReply={onCreateReply}
      />
    </SuspenseWrapper>
  );
}

function ThreadContent({
  selectedMessage,
  onClose,
  onCreateReply,
}: {
  selectedMessage: Memo;
  onClose: () => void;
  onCreateReply: (content: string, parentId?: string) => Promise<void>;
}) {
  const threads = useSuspenseQuery(['thread-replies', selectedMessage.id], async () => {
    const repliesResult = await getReplies({ memoId: selectedMessage.id });
    if (!repliesResult.success) {
      throw new Error(repliesResult.error.message);
    }
    return repliesResult.data;
  });

  return (
    <ThreadPanel
      selectedMessage={selectedMessage}
      threadReplies={threads}
      onClose={onClose}
      createMessageAction={onCreateReply}
    />
  );
}

export function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMessage = async (content: string, parentId?: string) => {
    if (!user) {
      setError('You must be logged in to post a message');
      return;
    }

    const newMemo: NewMemoInput = {
      content: content.trim(),
      user_id: user.id,
      parent_id: parentId || null,
    };

    try {
      const result = await createMemo(newMemo);
      if (result.success) {
        invalidateQuery(['memos']);
        invalidateQuery(['threads']);
        if (parentId) {
          invalidateQuery(['thread-replies', parentId]);
        }
        setError(null);
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to create message');
    }
  };

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <SlackLayout user={user} onSignOut={handleSignOut}>
      <div className="h-screen flex flex-col">
        {error && (
          <div className="alert alert-error mx-4 mt-4">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 flex">
          {/* Main Content - Loads First */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <MessageInput onSubmitAction={handleCreateMessage} />
            </div>

            <SuspenseWrapper
              fallback={<MessageListLoadingFallback />}
              errorFallback={({ resetErrorBoundary }) => (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load messages</p>
                    <button onClick={resetErrorBoundary} className="btn btn-primary">
                      Retry
                    </button>
                  </div>
                </div>
              )}
            >
              <MemoListSection
                onSelectMessage={setSelectedMessage}
                createMessageAction={handleCreateMessage}
              />
            </SuspenseWrapper>
          </div>

          {/* Thread Panel - Loads After Selection */}
          {selectedMessage && (
            <div className="w-96 border-l border-base-300">
              <ThreadSection
                selectedMessage={selectedMessage}
                onClose={() => setSelectedMessage(null)}
                onCreateReply={handleCreateMessage}
              />
            </div>
          )}
        </div>
      </div>
    </SlackLayout>
  );
}
