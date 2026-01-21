/**
 * Search Service with Service Handle Pattern
 *
 * 検索サービスの実装。
 */

import { okAsync } from 'neverthrow';
import type { Database } from '../../../api/db';
import { createSearchRepository } from '../../repositories/search.repository';
import { createMentionRepository } from '../../repositories/mention.repository';
import type { SearchServiceHandle } from './types';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

/**
 * SearchService Handle を作成
 */
export const createSearchService = ({ db }: { db: Database }): SearchServiceHandle => {
  const searchRepo = createSearchRepository({ db });
  const mentionRepo = createMentionRepository({ db });

  return {
    searchByContent: (query, limit = 20) => searchRepo.searchByContent(query, limit),

    searchByMention: (noteId) =>
      mentionRepo.getMentionsWithNotes(noteId).map((mentions) => mentions.map((m) => m.notes)),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

/**
 * テスト用のモック Handle を作成するヘルパー
 */
export const createMockSearchService = (
  overrides: Partial<SearchServiceHandle> = {}
): SearchServiceHandle => ({
  searchByContent: () => okAsync([]),
  searchByMention: () => okAsync([]),
  ...overrides,
});
