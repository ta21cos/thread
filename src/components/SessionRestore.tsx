'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function SessionRestore() {
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if there's a persisted session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session restoration error:', error);
          return;
        }

        if (session) {
          // Session exists and is valid
          console.log('Session restored successfully');

          // Check if token needs refresh
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const timeUntilExpiry = expiresAt * 1000 - Date.now();

            // If token expires in less than 10 minutes, refresh it proactively
            if (timeUntilExpiry < 10 * 60 * 1000) {
              console.log('Proactively refreshing session');
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('Proactive refresh failed:', refreshError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      }
    };

    restoreSession();
  }, []);

  return null; // This component doesn't render anything
}
