import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import notesRoutes from './routes/notes';
import searchRoutes from './routes/search';
import mentionsRoutes from './routes/mentions';
import usersRoutes from './routes/users';
import { errorHandler } from './middleware/error';

// NOTE: Hono app instance and router setup with method chaining for proper type inference
const app = new Hono()
  // Middleware
  .use('*', logger())
  .use('*', cors())
  // Routes - Order matters! Specific routes before generic ones
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
