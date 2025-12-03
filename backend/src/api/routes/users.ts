import { Hono } from 'hono';
import { UserSyncService, type SyncUserDto } from '../../services/user-sync.service';
import { db } from '../../db';
import { requireAuth } from '../../auth/middleware/auth.middleware';

const users = new Hono();

// NOTE: Protected endpoint - requires authentication
users.post('/sync', requireAuth, async (c) => {
  try {
    const body = await c.req.json<SyncUserDto>();

    // NOTE: Validate required fields
    if (!body.provider || !body.providerUserId) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'provider and providerUserId are required',
        },
        400
      );
    }

    // NOTE: Validate provider enum
    const validProviders = ['CLERK', 'AUTH0', 'GOOGLE', 'GITHUB'];
    if (!validProviders.includes(body.provider)) {
      return c.json(
        {
          error: 'Bad Request',
          message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
        },
        400
      );
    }

    // NOTE: Instantiate service at request time to ensure db is initialized
    const userSyncService = new UserSyncService({ db });
    const result = await userSyncService.syncUser(body);

    return c.json(result, 200);
  } catch (error) {
    console.error('User sync error:', error);
    return c.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to sync user',
      },
      500
    );
  }
});

export default users;
