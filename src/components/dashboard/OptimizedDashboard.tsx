'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createMemo } from '@/app/actions/memo/create';
import { Memo } from '@/lib/prisma/types';
import { SlackLayout } from '@/components/SlackLayout';
import { SuspenseWrapper } from '@/components/suspense/SuspenseWrapper';
import {
  MessageListLoadingFallback,
  ThreadLoadingFallback,
} from '@/components/suspense/LoadingFallbacks';
import { CleanMemoList } from './CleanMemoList';
import { ThreadViewer } from './ThreadViewer';
import { MessageInput } from '@/components/MessageInput';
import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getDashboardData } from '@/app/actions/memo/get-dashboard-data';
import { getRecentMemos } from '@/app/actions/memo/get-memos-optimized';
import { getActiveThreads } from '@/app/actions/thread/get-thread-data';

// Pure UI component - no data fetching
function DashboardStats({
  totalMessages,
  totalThreads,
  conversationCount,
}: {
  totalMessages: number;
  totalThreads: number;
  conversationCount: number;
}) {
  return (
    <div className="px-4 py-2 bg-base-200 border-b">
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-base-content/80">{totalMessages} messages</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-base-content/80">{totalThreads} active threads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-base-content/80">{conversationCount} conversations</span>
        </div>
      </div>
    </div>
  );
}

// Data fetching component
function DashboardDataProvider({ children }: { children: (data: unknown) => React.ReactNode }) {
  const dashboardData = useSuspenseQuery(['dashboard-complete'], async () => {
    const [mainData, recentMemos, activeThreads] = await Promise.all([
      getDashboardData(),
      getRecentMemos(20),
      getActiveThreads(10),
    ]);

    if (!mainData.success) throw new Error(mainData.error.message);
    if (!recentMemos.success) throw new Error(recentMemos.error.message);
    if (!activeThreads.success) throw new Error(activeThreads.error.message);

    return {
      ...mainData.data,
      recentMemos: recentMemos.data,
      activeThreads: activeThreads.data,
    };
  });

  return <>{children(dashboardData)}</>;
}

// Main content component
function DashboardMainContent({
  memos,
  createMessageAction,
}: {
  memos: Memo[];
  createMessageAction: (content: string, parentId?: string) => Promise<void>;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <MessageInput onSubmitAction={createMessageAction} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <CleanMemoList memos={memos} onEditMessage={() => {}} onDeleteMessage={() => {}} />
      </div>
    </div>
  );
}

// Thread sidebar component
function ThreadSidebar({
  selectedMessage,
  onClose,
  onCreateReply,
}: {
  selectedMessage: Memo | null;
  onClose: () => void;
  onCreateReply: (content: string, parentId: string) => Promise<void>;
}) {
  if (!selectedMessage) return null;

  return (
    <div className="w-96 border-l border-base-300">
      <SuspenseWrapper fallback={<ThreadLoadingFallback />}>
        <ThreadViewer
          selectedMessage={selectedMessage}
          onClose={onClose}
          onCreateReply={onCreateReply}
        />
      </SuspenseWrapper>
    </div>
  );
}

export function OptimizedDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMessage = async (content: string, parentId?: string) => {
    if (!user) {
      setError('You must be logged in to post a message');
      return;
    }

    try {
      const result = await createMemo({
        content: content.trim(),
        user_id: user.id,
        parent_id: parentId || null,
      });

      if (result.success) {
        setError(null);
        // Server action handles cache invalidation
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to create message');
    }
  };

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

        <SuspenseWrapper fallback={<MessageListLoadingFallback />}>
          <DashboardDataProvider>
            {(data: any) => (
              <>
                <DashboardStats
                  totalMessages={data.totalMessages}
                  totalThreads={data.totalThreads}
                  conversationCount={data.memos.length}
                />

                <div className="flex-1 min-h-0 flex">
                  <DashboardMainContent
                    memos={data.memos}
                    threads={data.threads}
                    onSelectMessage={setSelectedMessage}
                    createMessageAction={handleCreateMessage}
                  />

                  <ThreadSidebar
                    selectedMessage={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    onCreateReply={handleCreateMessage}
                  />
                </div>
              </>
            )}
          </DashboardDataProvider>
        </SuspenseWrapper>
      </div>
    </SlackLayout>
  );
}
