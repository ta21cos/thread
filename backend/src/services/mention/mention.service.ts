/**
 * Mention Service with Service Handle Pattern
 *
 * メンション管理サービスの実装。
 */

import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import type { Database } from '../../db';
import { createMentionRepository } from '../../repositories/mention.repository';
import type { MentionServiceHandle } from './types';
import { detectCircularReference } from './validation';

// ==========================================
// Result Utilities
// ==========================================

import { Result } from 'neverthrow';

/** Result を ResultAsync に変換 */
const fromResult = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.isOk() ? okAsync(result.value) : errAsync(result.error);

// ==========================================
// Handle Implementation (Factory)
// ==========================================

/**
 * MentionService Handle を作成
 */
export const createMentionService = ({ db }: { db: Database }): MentionServiceHandle => {
  const mentionRepo = createMentionRepository({ db });

  return {
    getMentions: (toNoteId, authorId) => mentionRepo.findByToNoteId(toNoteId, authorId),

    getMentionsWithNotes: (toNoteId, authorId) =>
      mentionRepo.getMentionsWithNotes(toNoteId, authorId),

    validateMentions: (fromNoteId, toNoteIds) =>
      mentionRepo
        .getAllMentions()
        .andThen((graph) => fromResult(detectCircularReference(graph, fromNoteId, toNoteIds))),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

/**
 * テスト用のモック Handle を作成するヘルパー
 */
export const createMockMentionService = (
  overrides: Partial<MentionServiceHandle> = {}
): MentionServiceHandle => ({
  getMentions: () => okAsync([]),
  getMentionsWithNotes: () => okAsync([]),
  validateMentions: () => okAsync(undefined),
  ...overrides,
});
