import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MAX_NOTE_LENGTH, ID_LENGTH } from '@thread-note/shared/constants';

// NOTE: Zod validation schemas
export const createNoteSchema = z.object({
  content: z.string().min(1).max(MAX_NOTE_LENGTH),
  parentId: z
    .string()
    .regex(new RegExp(`^[A-Za-z0-9]{${ID_LENGTH}}$`))
    .optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(MAX_NOTE_LENGTH),
});

export const noteIdSchema = z.object({
  id: z.string().regex(new RegExp(`^[A-Za-z0-9]{${ID_LENGTH}}$`)),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['content', 'mention']).default('content'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)),
});

export const paginationSchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  offset: z.string().transform(Number).pipe(z.number().min(0)),
});

// NOTE: Export validators - types will be inferred from Hono app context
export const validateCreateNote = zValidator('json', createNoteSchema);
export const validateUpdateNote = zValidator('json', updateNoteSchema);
export const validateNoteId = zValidator('param', noteIdSchema);
export const validateSearch = zValidator('query', searchQuerySchema);
export const validatePagination = zValidator('query', paginationSchema);
