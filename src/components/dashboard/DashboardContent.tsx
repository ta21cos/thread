'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createMemo } from '@/app/actions/memo/create';
import { NewMemoInput } from '@/app/actions/memo/schema';
import { Memo } from '@/lib/prisma/types';
import { SlackLayout } from '@/components/SlackLayout';
import { TwoColumnLayout } from '@/components/TwoColumnLayout';
import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { getDashboardData } from '@/app/actions/memo/get-dashboard-data';

export function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single query to fetch all dashboard data
  const dashboardData = useSuspenseQuery(['dashboard-data'], async () => {
    const result = await getDashboardData();
    // const a = 1;
    // if (!a || a) {
    //   throw new Error('test');
    // }

    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

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
        // The server action will handle cache invalidation
        // Force re-fetch by invalidating our local query
        setError(null);
        // Trigger a refresh of dashboard data
        window.location.reload(); // Simple approach for now
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to create message');
    }
  };

  const handleEditMessage = (memo: Memo) => {
    console.log('Edit message:', memo);
  };

  const handleDeleteMessage = (memoId: string) => {
    console.log('Delete message:', memoId);
  };

  const handleSelectMessage = (message: Memo) => {
    setSelectedMessage(message);
  };

  const handleCloseThread = () => {
    setSelectedMessage(null);
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="px-4 py-2 bg-base-200 border-b">
          <div className="flex gap-4 text-sm text-base-content/60">
            <span>{dashboardData.totalMessages} total messages</span>
            <span>{dashboardData.totalThreads} active threads</span>
            <span>{dashboardData.memos.length} conversations</span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <TwoColumnLayout
            messages={dashboardData.memos}
            threads={dashboardData.threads}
            selectedMessage={selectedMessage}
            createMessageAction={handleCreateMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectMessageAction={handleSelectMessage}
            onCloseThreadAction={handleCloseThread}
          />
        </div>
      </div>
    </SlackLayout>
  );
}
