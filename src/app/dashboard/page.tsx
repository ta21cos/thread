'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Memo } from '@/lib/db/schema';

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch memos when user is authenticated
  useEffect(() => {
    if (user) {
      // This is a placeholder for actual data fetching
      // In a real app, you would fetch memos from Supabase here
      const fetchMemos = async () => {
        try {
          // Placeholder data - in a real app, this would be fetched from the database
          setMemos([]);
        } catch (error) {
          console.error('Error fetching memos:', error);
        }
      };
      
      fetchMemos();
    }
  }, [user]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Thread</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="btn btn-outline btn-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create a New Memo</h2>
            <form className="space-y-4">
              <div>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="What's on your mind?"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Post Memo
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Recent Memos</h2>
            
            {memos.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                <p>No memos yet. Create your first memo above!</p>
              </div>
            ) : (
              memos.map((memo) => (
                <div key={memo.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">User ID: {memo.user_id}</p>
                      <p className="mt-1">{memo.content}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(memo.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white shadow mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Thread App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
