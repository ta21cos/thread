import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions } from '../../db';
import { createMentionService } from '.';
import { generateId } from '../../utils/id-generator';

describe('MentionService', () => {
  const prepareServices = () => {
    const service = createMentionService({ db });

    // ResultAsync を Promise に変換するラッパー
    return {
      getMentions: async (toNoteId: string) => {
        const result = await service.getMentions(toNoteId);
        return result.match(
          (mentions) => mentions,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      getMentionsWithNotes: async (toNoteId: string) => {
        const result = await service.getMentionsWithNotes(toNoteId);
        return result.match(
          (mentions) => mentions,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      validateMentions: async (fromNoteId: string, toNoteIds: string[]) => {
        const result = await service.validateMentions(fromNoteId, toNoteIds);
        return result.match(
          () => undefined,
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

  describe('getMentions', () => {
    it('should return empty array when no mentions exist for a note', async () => {
      const mentionService = prepareServices();

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

      const result = await mentionService.getMentions(noteId);

      expect(result).toEqual([]);
    });

    it('should return mentions pointing to a specific note', async () => {
      const mentionService = prepareServices();

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
          content: `Mentioning @${targetNoteId}`,
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
        position: 11,
        createdAt: now,
      });

      const result = await mentionService.getMentions(targetNoteId);

      expect(result).toHaveLength(1);
      expect(result[0].fromNoteId).toBe(sourceNoteId);
      expect(result[0].toNoteId).toBe(targetNoteId);
    });

    it('should return multiple mentions for the same target note', async () => {
      const mentionService = prepareServices();

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
          content: `First mention @${targetNoteId}`,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sourceNoteId2,
          content: `Second mention @${targetNoteId}`,
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
          position: 14,
          createdAt: now,
        },
        {
          id: generateId(),
          fromNoteId: sourceNoteId2,
          toNoteId: targetNoteId,
          position: 15,
          createdAt: now,
        },
      ]);

      const result = await mentionService.getMentions(targetNoteId);

      expect(result).toHaveLength(2);
    });
  });

  describe('getMentionsWithNotes', () => {
    it('should return empty array when no mentions exist', async () => {
      const mentionService = prepareServices();

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

      const result = await mentionService.getMentionsWithNotes(noteId);

      expect(result).toEqual([]);
    });

    it('should return mentions with associated note data', async () => {
      const mentionService = prepareServices();

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

      const result = await mentionService.getMentionsWithNotes(targetNoteId);

      expect(result).toHaveLength(1);
      expect(result[0].notes).toBeDefined();
      expect(result[0].notes.id).toBe(sourceNoteId);
    });
  });

  describe('validateMentions', () => {
    it('should allow valid mentions without cycles', async () => {
      const mentionService = prepareServices();

      const noteId1 = generateId();
      const noteId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId1,
          content: 'Note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId2,
          content: 'Note 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await expect(mentionService.validateMentions(noteId1, [noteId2])).resolves.toBeUndefined();
    });

    it('should detect direct circular reference (A -> B -> A)', async () => {
      const mentionService = prepareServices();

      const noteId1 = generateId();
      const noteId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId1,
          content: 'Note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId2,
          content: 'Note 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
        id: generateId(),
        fromNoteId: noteId2,
        toNoteId: noteId1,
        position: 0,
        createdAt: now,
      });

      await expect(mentionService.validateMentions(noteId1, [noteId2])).rejects.toThrow();
    });

    it('should detect indirect circular reference (A -> B -> C -> A)', async () => {
      const mentionService = prepareServices();

      const noteId1 = generateId();
      const noteId2 = generateId();
      const noteId3 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId1,
          content: 'Note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId2,
          content: 'Note 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId3,
          content: 'Note 3',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values([
        {
          id: generateId(),
          fromNoteId: noteId2,
          toNoteId: noteId3,
          position: 0,
          createdAt: now,
        },
        {
          id: generateId(),
          fromNoteId: noteId3,
          toNoteId: noteId1,
          position: 0,
          createdAt: now,
        },
      ]);

      await expect(mentionService.validateMentions(noteId1, [noteId2])).rejects.toThrow();
    });

    it('should allow multiple mentions to same target', async () => {
      const mentionService = prepareServices();

      const noteId1 = generateId();
      const noteId2 = generateId();
      const noteId3 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId1,
          content: 'Note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId2,
          content: 'Note 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: noteId3,
          content: 'Note 3',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await expect(
        mentionService.validateMentions(noteId1, [noteId2, noteId3])
      ).resolves.toBeUndefined();
    });
  });
});
