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

// Not Found Errors (404 Not Found)
export interface NoteNotFoundError extends DomainError {
  readonly _tag: 'NoteNotFoundError';
  readonly noteId: string;
}

export interface ParentNoteNotFoundError extends DomainError {
  readonly _tag: 'ParentNoteNotFoundError';
  readonly parentId: string;
}

// Database Errors (500 Internal Server Error)
export interface DatabaseError extends DomainError {
  readonly _tag: 'DatabaseError';
  readonly originalError?: unknown;
}

// Union type for all note-related errors
export type NoteError =
  | ValidationError
  | ContentTooLongError
  | ContentEmptyError
  | CircularReferenceError
  | DepthLimitExceededError
  | NoteNotFoundError
  | ParentNoteNotFoundError
  | DatabaseError;

// Error constructors (pure functions)
export const validationError = (message: string, field?: string): ValidationError => ({
  _tag: 'ValidationError',
  message,
  field,
});

export const contentTooLongError = (maxLength: number, actualLength: number): ContentTooLongError => ({
  _tag: 'ContentTooLongError',
  message: `Note content must be at most ${maxLength} characters (got ${actualLength})`,
  maxLength,
  actualLength,
});

export const contentEmptyError = (): ContentEmptyError => ({
  _tag: 'ContentEmptyError',
  message: 'Note content cannot be empty',
});

export const circularReferenceError = (fromNoteId: string, toNoteIds: string[]): CircularReferenceError => ({
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

export const databaseError = (message: string, originalError?: unknown): DatabaseError => ({
  _tag: 'DatabaseError',
  message,
  originalError,
});

// Type guard functions
export const isValidationError = (error: NoteError): error is ValidationError =>
  error._tag === 'ValidationError';

export const isNotFoundError = (error: NoteError): boolean =>
  error._tag === 'NoteNotFoundError' || error._tag === 'ParentNoteNotFoundError';

export const isClientError = (error: NoteError): boolean =>
  error._tag === 'ValidationError' ||
  error._tag === 'ContentTooLongError' ||
  error._tag === 'ContentEmptyError' ||
  error._tag === 'CircularReferenceError' ||
  error._tag === 'DepthLimitExceededError';

// HTTP status code mapping
export const errorToStatusCode = (error: NoteError): 400 | 404 | 500 => {
  switch (error._tag) {
    case 'NoteNotFoundError':
    case 'ParentNoteNotFoundError':
      return 404;
    case 'ValidationError':
    case 'ContentTooLongError':
    case 'ContentEmptyError':
    case 'CircularReferenceError':
    case 'DepthLimitExceededError':
      return 400;
    case 'DatabaseError':
      return 500;
    default:
      return 500;
  }
};
