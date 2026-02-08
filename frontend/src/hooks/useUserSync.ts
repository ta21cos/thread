import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';

const isE2ETest = import.meta.env.VITE_E2E_TEST === 'true';

// NOTE: Actual user sync implementation using Clerk hooks
const useUserSyncImpl = () => {
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!userId || !user) return;

    const syncUser = async () => {
      try {
        const token = await getToken();

        await fetch(`${import.meta.env.VITE_BACKEND_API_ENDPOINT}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            provider: 'CLERK',
            providerUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
            displayName: user.fullName || user.username || user.primaryEmailAddress?.emailAddress,
            avatarUrl: user.imageUrl,
            metadata: {
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
            },
            providerCreatedAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
            providerUpdatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
          }),
        });
      } catch (error) {
        console.error('User sync failed:', error);
        // NOTE: Don't block UI on sync failure
      }
    };

    syncUser();
  }, [userId, user, getToken]);
};

// NOTE: No-op stub for E2E test mode when Clerk is not available
const useUserSyncStub = () => {};

export const useUserSync = isE2ETest ? useUserSyncStub : useUserSyncImpl;
