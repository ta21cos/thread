import { createClerkClient, type ClerkClient } from '@clerk/backend';

let _clerkClient: ClerkClient | null = null;

export interface ClerkEnv {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}

// NOTE: Lazy initialization for Cloudflare Workers compatibility
export const getClerkClient = (env: ClerkEnv): ClerkClient => {
  if (_clerkClient) {
    return _clerkClient;
  }

  const secretKey = env.CLERK_SECRET_KEY;
  const publishableKey = env.CLERK_PUBLISHABLE_KEY;

  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is required');
  }

  if (!publishableKey) {
    throw new Error('CLERK_PUBLISHABLE_KEY is required');
  }

  _clerkClient = createClerkClient({
    secretKey,
    publishableKey,
  });

  return _clerkClient;
};
