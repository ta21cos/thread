/**
 * Mention Service Module
 *
 * メンションサービスの公開API。
 */

// Types
export type { MentionWithNote, MentionServiceHandle } from './types';

// Validation (exported for testing)
export { detectCircularReference } from './validation';

// Service Handle
export { createMentionService, createMockMentionService } from './mention.service';
