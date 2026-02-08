import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MAX_NOTE_LENGTH, ID_LENGTH } from '@thread-note/shared/constants';

// ==========================================
// Reusable Validators
// ==========================================

/** 6文字英数字IDのバリデータ */
export const idValidator = z.string().regex(new RegExp(`^[A-Za-z0-9]{${ID_LENGTH}}$`));

/** オプショナルな6文字英数字IDのバリデータ */
export const optionalIdValidator = idValidator.optional();

/** nullableな6文字英数字IDのバリデータ */
export const nullableIdValidator = idValidator.nullable().optional();

/** 日付文字列（YYYY-MM-DD）のバリデータ */
export const dateValidator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 16進カラーコード（#RRGGBB）のバリデータ */
export const colorValidator = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// ==========================================
// ID Schema Factories
// ==========================================

/** パラメータID用スキーマを生成 */
export const createIdParamSchema = <T extends string>(fieldName: T = 'id' as T) =>
  z.object({ [fieldName]: idValidator } as { [K in T]: typeof idValidator });

/** 複数パラメータID用スキーマ */
export const idParamSchema = createIdParamSchema('id');
export const noteIdParamSchema = createIdParamSchema('noteId');

// ==========================================
// Note Schemas
// ==========================================

export const createNoteSchema = z.object({
  content: z.string().min(1).max(MAX_NOTE_LENGTH),
  parentId: optionalIdValidator,
  channelId: optionalIdValidator,
  isHidden: z.boolean().optional(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(MAX_NOTE_LENGTH),
});

export const updateHiddenSchema = z.object({
  isHidden: z.boolean(),
});

export const noteIdSchema = z.object({
  id: idValidator,
});

// ==========================================
// Channel Schemas
// ==========================================

export const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  color: colorValidator.optional(),
  icon: z.string().max(20).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: colorValidator.optional(),
  icon: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ==========================================
// Scratch Pad Schemas
// ==========================================

export const updateScratchPadSchema = z.object({
  content: z.string(),
  channelId: nullableIdValidator,
});

export const convertToNoteSchema = z.object({
  channelId: nullableIdValidator,
});

// ==========================================
// Template Schemas
// ==========================================

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

// ==========================================
// Query Schemas
// ==========================================

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['content', 'mention']).default('content'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)),
});

export const paginationSchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  offset: z.string().transform(Number).pipe(z.number().min(0)),
});

export const calendarParamSchema = z.object({
  year: z.string().transform(Number).pipe(z.number().min(1900).max(2100)),
  month: z.string().transform(Number).pipe(z.number().min(1).max(12)),
});

export const dateParamSchema = z.object({
  date: dateValidator,
});

// ==========================================
// Validators (Middleware)
// ==========================================

// Note validators
export const validateCreateNote = zValidator('json', createNoteSchema);
export const validateUpdateNote = zValidator('json', updateNoteSchema);
export const validateUpdateHidden = zValidator('json', updateHiddenSchema);
export const validateNoteId = zValidator('param', noteIdSchema);

// Channel validators
export const validateCreateChannel = zValidator('json', createChannelSchema);
export const validateUpdateChannel = zValidator('json', updateChannelSchema);
export const validateChannelId = zValidator('param', idParamSchema);

// Scratch pad validators
export const validateUpdateScratchPad = zValidator('json', updateScratchPadSchema);
export const validateConvertToNote = zValidator('json', convertToNoteSchema);

// Template validators
export const validateCreateTemplate = zValidator('json', createTemplateSchema);
export const validateUpdateTemplate = zValidator('json', updateTemplateSchema);
export const validateTemplateId = zValidator('param', idParamSchema);

// Task validators
export const validateTaskId = zValidator('param', idParamSchema);

// Bookmark validators
export const validateBookmarkNoteId = zValidator('param', noteIdParamSchema);

// Query validators
export const validateSearch = zValidator('query', searchQuerySchema);
export const validatePagination = zValidator('query', paginationSchema);
export const validateCalendar = zValidator('param', calendarParamSchema);
export const validateDate = zValidator('param', dateParamSchema);
