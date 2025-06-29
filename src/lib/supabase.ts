import { createClient } from '@supabase/supabase-js';

// These environment variables are exposed to the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.setItem(key, value);
        } catch {
          // Silently fail if localStorage is not available
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return;
        try {
          localStorage.removeItem(key);
        } catch {
          // Silently fail if localStorage is not available
        }
      },
    },
  },
});

// Helper function to get user from server components
export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper function to get session from server components
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Export Supabase storage for file uploads
export const storage = supabase.storage;
