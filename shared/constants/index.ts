// NOTE: Shared constants across frontend and backend
export const MAX_NOTE_LENGTH = 1000;
export const MAX_THREAD_DEPTH = 100;
// NOTE: Maximum reply depth (0 = root note, 1 = direct reply only)
export const MAX_REPLY_DEPTH = 1;
export const ID_LENGTH = 6;
export const ID_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const ERROR_CODES = {
  NOTE_NOT_FOUND: 'NOTE_NOT_FOUND',
  INVALID_CONTENT_LENGTH: 'INVALID_CONTENT_LENGTH',
  CIRCULAR_REFERENCE: 'CIRCULAR_REFERENCE',
  MAX_DEPTH_EXCEEDED: 'MAX_DEPTH_EXCEEDED',
  INVALID_PARENT: 'INVALID_PARENT',
} as const;

export const PERFORMANCE_TARGETS = {
  MAX_RESPONSE_TIME_MS: 200,
  MAX_NOTES_FOR_TESTING: 1000,
} as const;
