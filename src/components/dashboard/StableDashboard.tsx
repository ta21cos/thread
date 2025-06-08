'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { createMemo } from '@/app/actions/memo/create';
import { NewMemoInput } from '@/app/actions/memo/schema';
import { Memo } from '@/lib/prisma/types';
import { SlackLayout } from '@/components/SlackLayout';
import { TwoColumnLayout } from '@/components/TwoColumnLayout';
import { useStableQuery, invalidateQueries } from '@/hooks/useStableQuery';
import { getDashboardData } from '@/app/actions/memo/get-dashboard-data';

export function StableDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Using stable query hook with React cache()
  const {
    data: dashboardData,
    isLoading,
    error: queryError,
    refetch,
  } = useStableQuery(
    ['dashboard-data'],
    async () => {
      const result = await getDashboardData();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

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
        setError(null);
        // Invalidate and refetch dashboard data
        invalidateQueries('dashboard');
        await refetch();
      } else {
        setError(result.error.message);
      }
    } catch (_err) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">Failed to load dashboard</h2>
          <p className="text-base-content/60 mb-6">{queryError.message}</p>
          <button onClick={refetch} className="btn btn-primary">
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

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
            <button
              onClick={refetch}
              className="ml-auto text-xs btn btn-ghost btn-xs"
              title="Refresh data"
            >
              ↻ Refresh
            </button>
          </div>
        </dionSelectMessageAction

        <div className="flex-1 min-h-0">
          <TwoColumnLayout
            messages={dashboardData.memos}
            threads={dashboardData.threads}
            selectedMessage={selectedMessage}
            createMessageAction={handleCreateMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectMessage={handleSelectMessage}
            onCloseThreadAction={handleCloseThread}
          />
        </div>
      </div>
    </SlackLayout>
  );
}
