import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions } from '../../db';
import { createSearchService } from '.';
import { generateId } from '../../utils/id-generator';

describe('SearchService', () => {
  const prepareServices = () => {
    const service = createSearchService({ db });

    // ResultAsync を Promise に変換するラッパー
    return {
      searchByContent: async (query: string, limit?: number) => {
        const result = await service.searchByContent(query, limit);
        return result.match(
          (notes) => notes,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      searchByMention: async (noteId: string) => {
        const result = await service.searchByMention(noteId);
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
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Second note about JavaScript frameworks',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Note about Python',
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
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId,
          content: `Source note @${targetNoteId}`,
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
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId1,
          content: `First source @${targetNoteId}`,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId2,
          content: `Second source @${targetNoteId}`,
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
});
