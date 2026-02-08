/**
 * Domain Error Types
 *
 * 型安全なエラーハンドリングのための明示的なエラー型定義。
 * 各エラー型は特定のドメインエラーを表し、HTTPステータスコードや
 * エラーメッセージへのマッピングを容易にする。
 */

// ベースエラーインターフェース
export interface DomainError {
  readonly _tag: string;
  readonly message: string;
}

// Validation Errors (400 Bad Request)
export interface ValidationError extends DomainError {
  readonly _tag: 'ValidationError';
  readonly field?: string;
}

export interface ContentTooLongError extends DomainError {
  readonly _tag: 'ContentTooLongError';
  readonly maxLength: number;
  readonly actualLength: number;
}

export interface ContentEmptyError extends DomainError {
  readonly _tag: 'ContentEmptyError';
}

export interface CircularReferenceError extends DomainError {
  readonly _tag: 'CircularReferenceError';
  readonly fromNoteId: string;
  readonly toNoteIds: string[];
}

export interface DepthLimitExceededError extends DomainError {
  readonly _tag: 'DepthLimitExceededError';
  readonly maxDepth: number;
}

export interface InvalidHiddenReplyError extends DomainError {
  readonly _tag: 'InvalidHiddenReplyError';
}

// Not Found Errors (404 Not Found)
export interface NoteNotFoundError extends DomainError {
  readonly _tag: 'NoteNotFoundError';
  readonly noteId: string;
}

export interface ParentNoteNotFoundError extends DomainError {
  readonly _tag: 'ParentNoteNotFoundError';
  readonly parentId: string;
}

export interface ChannelNotFoundError extends DomainError {
  readonly _tag: 'ChannelNotFoundError';
  readonly channelId: string;
}

export interface BookmarkNotFoundError extends DomainError {
  readonly _tag: 'BookmarkNotFoundError';
  readonly bookmarkId: string;
}

export interface TaskNotFoundError extends DomainError {
  readonly _tag: 'TaskNotFoundError';
  readonly taskId: string;
}

export interface DailyNoteNotFoundError extends DomainError {
  readonly _tag: 'DailyNoteNotFoundError';
  readonly date: string;
}

export interface TemplateNotFoundError extends DomainError {
  readonly _tag: 'TemplateNotFoundError';
  readonly templateId: string;
}

// Database Errors (500 Internal Server Error)
export interface DatabaseError extends DomainError {
  readonly _tag: 'DatabaseError';
  readonly originalError?: unknown;
}

// Union type for all domain errors
// Union type for all domain errors
// NOTE: Named AppError (not NoteError) since it covers all domain entities
export type AppError =
  | ValidationError
  | ContentTooLongError
  | ContentEmptyError
  | CircularReferenceError
  | DepthLimitExceededError
  | InvalidHiddenReplyError
  | NoteNotFoundError
  | ParentNoteNotFoundError
  | ChannelNotFoundError
  | BookmarkNotFoundError
  | TaskNotFoundError
  | DailyNoteNotFoundError
  | TemplateNotFoundError
  | DatabaseError;

/** @deprecated Use AppError instead */
export type NoteError = AppError;

// Error constructors (pure functions)
export const validationError = (message: string, field?: string): ValidationError => ({
  _tag: 'ValidationError',
  message,
  field,
});

export const contentTooLongError = (
  maxLength: number,
  actualLength: number
): ContentTooLongError => ({
  _tag: 'ContentTooLongError',
  message: `Note content must be at most ${maxLength} characters (got ${actualLength})`,
  maxLength,
  actualLength,
});

export const contentEmptyError = (): ContentEmptyError => ({
  _tag: 'ContentEmptyError',
  message: 'Note content cannot be empty',
});

export const circularReferenceError = (
  fromNoteId: string,
  toNoteIds: string[]
): CircularReferenceError => ({
  _tag: 'CircularReferenceError',
  message: 'Circular reference detected in mentions',
  fromNoteId,
  toNoteIds,
});

export const depthLimitExceededError = (maxDepth: number): DepthLimitExceededError => ({
  _tag: 'DepthLimitExceededError',
  message: `Cannot create child for a note that is already at maximum depth (${maxDepth})`,
  maxDepth,
});

export const invalidHiddenReplyError = (): InvalidHiddenReplyError => ({
  _tag: 'InvalidHiddenReplyError',
  message: 'Only root notes can be marked as hidden. Replies inherit hidden status from parent.',
});

export const noteNotFoundError = (noteId: string): NoteNotFoundError => ({
  _tag: 'NoteNotFoundError',
  message: `Note with id '${noteId}' not found`,
  noteId,
});

export const parentNoteNotFoundError = (parentId: string): ParentNoteNotFoundError => ({
  _tag: 'ParentNoteNotFoundError',
  message: `Parent note with id '${parentId}' not found`,
  parentId,
});

export const channelNotFoundError = (channelId: string): ChannelNotFoundError => ({
  _tag: 'ChannelNotFoundError',
  message: `Channel with id '${channelId}' not found`,
  channelId,
});

export const bookmarkNotFoundError = (bookmarkId: string): BookmarkNotFoundError => ({
  _tag: 'BookmarkNotFoundError',
  message: `Bookmark with id '${bookmarkId}' not found`,
  bookmarkId,
});

export const taskNotFoundError = (taskId: string): TaskNotFoundError => ({
  _tag: 'TaskNotFoundError',
  message: `Task with id '${taskId}' not found`,
  taskId,
});

export const dailyNoteNotFoundError = (date: string): DailyNoteNotFoundError => ({
  _tag: 'DailyNoteNotFoundError',
  message: `Daily note for date '${date}' not found`,
  date,
});

export const templateNotFoundError = (templateId: string): TemplateNotFoundError => ({
  _tag: 'TemplateNotFoundError',
  message: `Template with id '${templateId}' not found`,
  templateId,
});

export const databaseError = (message: string, originalError?: unknown): DatabaseError => ({
  _tag: 'DatabaseError',
  message,
  originalError,
});

// Type guard functions
export const isValidationError = (error: AppError): error is ValidationError =>
  error._tag === 'ValidationError';

export const isNotFoundError = (error: AppError): boolean =>
  error._tag === 'NoteNotFoundError' ||
  error._tag === 'ParentNoteNotFoundError' ||
  error._tag === 'ChannelNotFoundError' ||
  error._tag === 'BookmarkNotFoundError' ||
  error._tag === 'TaskNotFoundError' ||
  error._tag === 'DailyNoteNotFoundError' ||
  error._tag === 'TemplateNotFoundError';

export const isClientError = (error: AppError): boolean =>
  error._tag === 'ValidationError' ||
  error._tag === 'ContentTooLongError' ||
  error._tag === 'ContentEmptyError' ||
  error._tag === 'CircularReferenceError' ||
  error._tag === 'DepthLimitExceededError' ||
  error._tag === 'InvalidHiddenReplyError';

// HTTP status code mapping
export const errorToStatusCode = (error: AppError): 400 | 404 | 500 => {
  switch (error._tag) {
    case 'NoteNotFoundError':
    case 'ParentNoteNotFoundError':
    case 'ChannelNotFoundError':
    case 'BookmarkNotFoundError':
    case 'TaskNotFoundError':
    case 'DailyNoteNotFoundError':
    case 'TemplateNotFoundError':
      return 404;
    case 'ValidationError':
    case 'ContentTooLongError':
    case 'ContentEmptyError':
    case 'CircularReferenceError':
    case 'DepthLimitExceededError':
    case 'InvalidHiddenReplyError':
      return 400;
    case 'DatabaseError':
      return 500;
    default:
      return 500;
  }
};
