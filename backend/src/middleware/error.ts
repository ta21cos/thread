import type { Context } from 'hono';
import type { ErrorResponse } from '@thread-note/shared/types';

// NOTE: Error handling middleware
export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  const response: ErrorResponse = {
    error: err.name || 'Error',
    message: err.message || 'An error occurred',
  };

  // Map known errors to status codes
  if (err.message.includes('not found')) {
    return c.json(response, 404);
  }

  if (
    err.message.includes('character') ||
    err.message.includes('validation') ||
    err.message.includes('circular')
  ) {
    return c.json(response, 400);
  }

  return c.json(response, 500);
}
