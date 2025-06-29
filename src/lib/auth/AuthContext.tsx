'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let refreshTimer: NodeJS.Timeout | null = null;

    // Get initial session
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);

      // Set up token refresh timer if session exists
      if (data.session) {
        scheduleTokenRefresh(data.session);
      }
    };

    // Schedule automatic token refresh
    const scheduleTokenRefresh = (session: Session) => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      const expiresAt = session.expires_at;
      if (expiresAt) {
        // Refresh 5 minutes before expiration
        const refreshTime = expiresAt * 1000 - Date.now() - 5 * 60 * 1000;

        if (refreshTime > 0) {
          refreshTimer = setTimeout(async () => {
            try {
              const { data, error } = await supabase.auth.refreshSession();
              if (error) {
                console.error('Token refresh failed:', error);
                // Force sign out if refresh fails
                await supabase.auth.signOut();
              } else if (data.session) {
                // Schedule next refresh
                scheduleTokenRefresh(data.session);
              }
            } catch (error) {
              console.error('Token refresh error:', error);
            }
          }, refreshTime);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Handle token refresh scheduling
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        scheduleTokenRefresh(session);
      } else if (event === 'SIGNED_OUT') {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
