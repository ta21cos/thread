import { getClerkClient } from '../auth/clerk';

import { createMiddleware } from 'hono/factory';
import { Bindings, Variables } from 'hono/types';

type AuthBindings = {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  APP_DOMAIN: string;
};

export type AuthVariables = {
  userId: string;
  sessionId: string;
};

// NOTE: Generic middleware that works with any Hono environment
export const requireAuth = createMiddleware<{
  Bindings: Bindings & AuthBindings;
  Variables: Variables & AuthVariables;
}>(async (c, next) => {
  // NOTE: Skip auth only in test environment (NODE_ENV check is safer than env variable)
  if (process.env.NODE_ENV === 'test') {
    c.set('userId', 'test_user_123');
    c.set('sessionId', 'test_session_456');
    await next();
    return;
  }

  const CLERK_SECRET_KEY = c.env.CLERK_SECRET_KEY;
  const CLERK_PUBLISHABLE_KEY = c.env.CLERK_PUBLISHABLE_KEY;
  const ALLOWED_ORIGINS = c.env.ALLOWED_ORIGINS;
  const APP_DOMAIN = c.env.APP_DOMAIN;

  const clerkClient = getClerkClient({
    CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY,
  });

  const { isAuthenticated, toAuth, reason, message } = await clerkClient.authenticateRequest(
    c.req.raw,
    {
      authorizedParties: ALLOWED_ORIGINS.split(','),
      audience: APP_DOMAIN,
      clockSkewInMs: 5000,
    }
  );

  if (!isAuthenticated) {
    console.warn('Authentication failed:', { reason, message });
    return c.json(
      {
        error: 'Unauthorized',
        reason,
        message,
      },
      401
    );
  }

  const auth = toAuth();

  if (!auth.userId) {
    return c.json({ error: 'Invalid session' }, 401);
  }

  // NOTE: Set userId in context for downstream handlers
  c.set('userId', auth.userId);
  c.set('sessionId', auth.sessionId);

  await next();
});
