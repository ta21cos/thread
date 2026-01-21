/**
 * Note Service Module
 *
 * ノートサービスの公開API。
 */

// Types
export type {
  CreateNoteInput,
  UpdateNoteInput,
  PaginatedNotes,
  NoteServiceHandle,
  ValidatedNoteData,
} from './types';

// Validation (exported for testing)
export {
  fromResult,
  validateContentLength,
  extractMentionIds,
  detectCircularReference,
  calculateDepthFromParent,
} from './validation';

// Service Handle
export { createNoteService, createMockNoteService } from './note.service';

// Repository re-exports
export { createNoteRepository } from '../../repositories/note.repository';
export { createMentionRepository } from '../../repositories/mention.repository';
