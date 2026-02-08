import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import notesRoutes from './routes/notes';
import searchRoutes from './routes/search';
import mentionsRoutes from './routes/mentions';
import usersRoutes from './routes/users';
import channelsRoutes from './routes/channels';
import bookmarksRoutes from './routes/bookmarks';
import tasksRoutes from './routes/tasks';
import scratchPadRoutes from './routes/scratch-pad';
import dailyNotesRoutes from './routes/daily-notes';
import { errorHandler } from '../middleware/error';

// NOTE: Hono app instance and router setup with method chaining for proper type inference
const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', cors())
  // Routes - Order matters! Specific routes before generic ones
  .route('/api/channels', channelsRoutes) // /channels routes
  .route('/api/bookmarks', bookmarksRoutes) // /bookmarks routes
  .route('/api/tasks', tasksRoutes) // /tasks routes
  .route('/api/scratch-pad', scratchPadRoutes) // /scratch-pad routes
  .route('/api/daily-notes', dailyNotesRoutes) // /daily-notes routes
  .route('/api/notes', searchRoutes) // /search route
  .route('/api/notes', mentionsRoutes) // /:id/mentions route
  .route('/api/notes', notesRoutes) // /:id route (must be last)
  .route('/api/users', usersRoutes) // /sync route
  // NOTE: Health check endpoint for monitoring
  .get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  })
  .onError(errorHandler);

// NOTE: Export AppType for RPC client
export type AppType = typeof app;

export default app;
