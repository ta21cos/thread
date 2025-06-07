'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

import { getMemos } from '../actions/memo/get';
import { getReplies } from '../actions/memo/get-replies';
import { createMemo } from '../actions/memo/create';
import { NewMemoInput } from '../actions/memo/schema';
import { Memo } from '@/lib/prisma/types';
import { SlackLayout } from '@/components/SlackLayout';
import { TwoColumnLayout } from '@/components/TwoColumnLayout';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [threads, setThreads] = useState<Record<string, Memo[]>>({});
  const [selectedMessage, setSelectedMessage] = useState<Memo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch memos and threads when user is authenticated
  useEffect(() => {
    if (user) {
      fetchMemosAndThreads();
    }
  }, [user]);

  const fetchMemosAndThreads = async () => {
    try {
      // Fetch main memos (parent messages only)
      const memosResult = await getMemos();
      if (memosResult.success) {
        const mainMemos = memosResult.data.filter((memo) => !memo.parent_id);
        setMemos(mainMemos);

        // Fetch threads for each main memo
        const threadsData: Record<string, Memo[]> = {};
        for (const memo of mainMemos) {
          const repliesResult = await getReplies({ memoId: memo.id });
          if (repliesResult.success) {
            threadsData[memo.id] = repliesResult.data;
          }
        }
        setThreads(threadsData);
      } else {
        setError(memosResult.error.message);
      }
    } catch (error) {
      console.error('Error fetching memos and threads:', error);
      setError('Failed to load messages');
    }
  };

  // Handle memo creation (both main messages and thread replies)
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

    const result = await createMemo(newMemo);
    if (result.success) {
      // Refresh memos and threads after posting
      await fetchMemosAndThreads();
    } else {
      setError(result.error.message);
    }
  };

  // Handle memo editing (placeholder for future implementation)
  const handleEditMessage = (memo: Memo) => {
    console.log('Edit message:', memo);
    // TODO: Implement edit functionality
  };

  // Handle memo deletion (placeholder for future implementation)
  const handleDeleteMessage = (memoId: string) => {
    console.log('Delete message:', memoId);
    // TODO: Implement delete functionality
  };

  // Handle message selection for thread view
  const handleSelectMessage = (message: Memo) => {
    setSelectedMessage(message);
  };

  // Handle closing thread panel
  const handleCloseThread = () => {
    setSelectedMessage(null);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <SlackLayout user={user} onSignOut={handleSignOut}>
      <div className="h-screen flex flex-col">
        {/* Error display */}
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

        {/* Two column layout */}
        <div className="flex-1 min-h-0">
          <TwoColumnLayout
            messages={memos}
            threads={threads}
            selectedMessage={selectedMessage}
            onCreateMessage={handleCreateMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onSelectMessage={handleSelectMessage}
            onCloseThread={handleCloseThread}
          />
        </div>
      </div>
    </SlackLayout>
  );
}
