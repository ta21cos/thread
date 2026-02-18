import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions, profiles, channels } from '../../db';
import { createSearchService } from '.';
import { generateId } from '../../utils/id-generator';

const TEST_AUTHOR_ID = 'test-author-id';
const OTHER_AUTHOR_ID = 'other-author-id';
const TEST_CHANNEL_ID = 'test-channel-id';
const OTHER_CHANNEL_ID = 'other-channel-id';

describe('SearchService', () => {
  const prepareServices = (authorId: string = TEST_AUTHOR_ID) => {
    const service = createSearchService({ db });

    // ResultAsync を Promise に変換するラッパー
    return {
      searchByContent: async (query: string, limit?: number) => {
        const result = await service.searchByContent(authorId, query, limit);
        return result.match(
          (notes) => notes,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      searchByMention: async (noteId: string) => {
        const result = await service.searchByMention(noteId, authorId);
        return result.match(
          (notes) => notes,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
    };
  };

  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(notes);
    await db.delete(channels);
    await db.delete(profiles);
    await db.insert(profiles).values([
      {
        id: TEST_AUTHOR_ID,
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: OTHER_AUTHOR_ID,
        displayName: 'Other User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    await db.insert(channels).values([
      {
        id: TEST_CHANNEL_ID,
        authorId: TEST_AUTHOR_ID,
        name: 'Test Channel',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: OTHER_CHANNEL_ID,
        authorId: OTHER_AUTHOR_ID,
        name: 'Other Channel',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  describe('searchByContent', () => {
    it('should return empty array when no notes match', async () => {
      const searchService = prepareServices();

      const result = await searchService.searchByContent('nonexistent');

      expect(result).toEqual([]);
    });

    it('should find notes containing search query', async () => {
      const searchService = prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'This is a test note about TypeScript',
        authorId: TEST_AUTHOR_ID,
        channelId: TEST_CHANNEL_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await searchService.searchByContent('TypeScript');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(noteId);
    });

    it('should be case-insensitive', async () => {
      const searchService = prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'JavaScript Tutorial',
        authorId: TEST_AUTHOR_ID,
        channelId: TEST_CHANNEL_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await searchService.searchByContent('javascript');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(noteId);
    });

    it('should find multiple notes matching query', async () => {
      const searchService = prepareServices();

      const now = new Date();
      await db.insert(notes).values([
        {
          id: generateId(),
          content: 'First note about JavaScript',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Second note about JavaScript frameworks',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Note about Python',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await searchService.searchByContent('JavaScript');

      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      const searchService = prepareServices();

      const now = new Date();
      for (let i = 0; i < 10; i++) {
        await db.insert(notes).values({
          id: generateId(),
          content: `Test note number ${i}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + i * 1000),
          updatedAt: now,
        });
      }

      const result = await searchService.searchByContent('Test', 5);

      expect(result).toHaveLength(5);
    });

    it('should use default limit of 20', async () => {
      const searchService = prepareServices();

      const now = new Date();
      for (let i = 0; i < 25; i++) {
        await db.insert(notes).values({
          id: generateId(),
          content: `Search note ${i}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + i * 1000),
          updatedAt: now,
        });
      }

      const result = await searchService.searchByContent('Search');

      expect(result).toHaveLength(20);
    });
  });

  describe('searchByMention', () => {
    it('should return empty array when note has no mentions', async () => {
      const searchService = prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Test note',
        authorId: TEST_AUTHOR_ID,
        channelId: TEST_CHANNEL_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await searchService.searchByMention(noteId);

      expect(result).toEqual([]);
    });

    it('should find notes that mention the target note', async () => {
      const searchService = prepareServices();

      const targetNoteId = generateId();
      const sourceNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: targetNoteId,
          content: 'Target note',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId,
          content: `Source note @${targetNoteId}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
        id: generateId(),
        fromNoteId: sourceNoteId,
        toNoteId: targetNoteId,
        position: 12,
        createdAt: now,
      });

      const result = await searchService.searchByMention(targetNoteId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(sourceNoteId);
    });

    it('should find multiple notes mentioning the target', async () => {
      const searchService = prepareServices();

      const targetNoteId = generateId();
      const sourceNoteId1 = generateId();
      const sourceNoteId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: targetNoteId,
          content: 'Target note',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId1,
          content: `First source @${targetNoteId}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId2,
          content: `Second source @${targetNoteId}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values([
        {
          id: generateId(),
          fromNoteId: sourceNoteId1,
          toNoteId: targetNoteId,
          position: 13,
          createdAt: now,
        },
        {
          id: generateId(),
          fromNoteId: sourceNoteId2,
          toNoteId: targetNoteId,
          position: 14,
          createdAt: now,
        },
      ]);

      const result = await searchService.searchByMention(targetNoteId);

      expect(result).toHaveLength(2);
    });
  });

  describe('cross-user isolation', () => {
    it('should not return notes from other users in content search', async () => {
      const mySearch = prepareServices(TEST_AUTHOR_ID);
      const otherSearch = prepareServices(OTHER_AUTHOR_ID);

      const now = new Date();
      await db.insert(notes).values([
        {
          id: generateId(),
          content: 'Shared keyword note',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Shared keyword note from other',
          authorId: OTHER_AUTHOR_ID,
          channelId: OTHER_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const myResults = await mySearch.searchByContent('Shared keyword');
      expect(myResults).toHaveLength(1);
      expect(myResults[0].authorId).toBe(TEST_AUTHOR_ID);

      const otherResults = await otherSearch.searchByContent('Shared keyword');
      expect(otherResults).toHaveLength(1);
      expect(otherResults[0].authorId).toBe(OTHER_AUTHOR_ID);
    });

    it('should not return mentions from other users notes', async () => {
      const otherSearch = prepareServices(OTHER_AUTHOR_ID);

      const targetNoteId = generateId();
      const sourceNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: targetNoteId,
          content: 'Target note',
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId,
          content: `Source note @${targetNoteId}`,
          authorId: TEST_AUTHOR_ID,
          channelId: TEST_CHANNEL_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
        id: generateId(),
        fromNoteId: sourceNoteId,
        toNoteId: targetNoteId,
        position: 12,
        createdAt: now,
      });

      const result = await otherSearch.searchByMention(targetNoteId);
      expect(result).toEqual([]);
    });
  });
});
