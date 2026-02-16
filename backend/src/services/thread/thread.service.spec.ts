import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions, profiles } from '../../db';
import { createThreadService } from '.';
import { generateId } from '../../utils/id-generator';

const TEST_AUTHOR_ID = 'test-author-id';

describe('ThreadService', () => {
  const prepareServices = () => {
    const service = createThreadService({ db });

    // ResultAsync を Promise に変換するラッパー
    return {
      getThread: async (noteId: string) => {
        const result = await service.getThread(noteId);
        return result.match(
          (notes) => notes,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      getChildren: async (noteId: string) => {
        const result = await service.getChildren(noteId);
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
    await db.delete(profiles);
    await db.insert(profiles).values({
      id: TEST_AUTHOR_ID,
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('getThread', () => {
    it('should throw error when note does not exist', async () => {
      const threadService = prepareServices();

      await expect(threadService.getThread('nonexistent')).rejects.toThrow();
    });

    it('should return single note thread for root note', async () => {
      const threadService = prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Root note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await threadService.getThread(noteId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(noteId);
    });

    it('should return full thread when queried from root note', async () => {
      const threadService = prepareServices();

      const rootId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: rootId,
        content: 'Root note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values({
        id: childId,
        content: 'Child note',
        authorId: TEST_AUTHOR_ID,
        parentId: rootId,
        depth: 1,
        createdAt: now,
        updatedAt: now,
      });

      const result = await threadService.getThread(rootId);

      expect(result).toHaveLength(2);
      expect(result.find((n) => n.id === rootId)).toBeDefined();
      expect(result.find((n) => n.id === childId)).toBeDefined();
    });

    it('should return full thread when queried from child note', async () => {
      const threadService = prepareServices();

      const rootId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: rootId,
        content: 'Root note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values({
        id: childId,
        content: 'Child note',
        authorId: TEST_AUTHOR_ID,
        parentId: rootId,
        depth: 1,
        createdAt: now,
        updatedAt: now,
      });

      const result = await threadService.getThread(childId);

      expect(result).toHaveLength(2);
      expect(result.find((n) => n.id === rootId)).toBeDefined();
      expect(result.find((n) => n.id === childId)).toBeDefined();
    });

    it('should return thread with multiple children', async () => {
      const threadService = prepareServices();

      const rootId = generateId();
      const childId1 = generateId();
      const childId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: rootId,
          content: 'Root note',
          authorId: TEST_AUTHOR_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId1,
          content: 'Child 1',
          authorId: TEST_AUTHOR_ID,
          parentId: rootId,
          depth: 1,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        },
        {
          id: childId2,
          content: 'Child 2',
          authorId: TEST_AUTHOR_ID,
          parentId: rootId,
          depth: 1,
          createdAt: new Date(now.getTime() + 2000),
          updatedAt: now,
        },
      ]);

      const result = await threadService.getThread(rootId);

      expect(result).toHaveLength(3);
    });

    it('should not include notes from other threads', async () => {
      const threadService = prepareServices();

      const thread1RootId = generateId();
      const thread1ChildId = generateId();
      const thread2RootId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: thread1RootId,
          content: 'Thread 1 root',
          authorId: TEST_AUTHOR_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: thread1ChildId,
          content: 'Thread 1 child',
          authorId: TEST_AUTHOR_ID,
          parentId: thread1RootId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: thread2RootId,
          content: 'Thread 2 root',
          authorId: TEST_AUTHOR_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await threadService.getThread(thread1RootId);

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.id !== thread2RootId)).toBe(true);
    });
  });

  describe('getChildren', () => {
    it('should return empty array when note has no children', async () => {
      const threadService = prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Root note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await threadService.getChildren(noteId);

      expect(result).toEqual([]);
    });

    it('should return direct children of a note', async () => {
      const threadService = prepareServices();

      const parentId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values({
        id: childId,
        content: 'Child note',
        authorId: TEST_AUTHOR_ID,
        parentId: parentId,
        depth: 1,
        createdAt: now,
        updatedAt: now,
      });

      const result = await threadService.getChildren(parentId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(childId);
    });

    it('should return multiple children', async () => {
      const threadService = prepareServices();

      const parentId = generateId();
      const childId1 = generateId();
      const childId2 = generateId();
      const childId3 = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        authorId: TEST_AUTHOR_ID,
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values([
        {
          id: childId1,
          content: 'Child 1',
          authorId: TEST_AUTHOR_ID,
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId2,
          content: 'Child 2',
          authorId: TEST_AUTHOR_ID,
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId3,
          content: 'Child 3',
          authorId: TEST_AUTHOR_ID,
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await threadService.getChildren(parentId);

      expect(result).toHaveLength(3);
    });

    it('should only return direct children (not grandchildren)', async () => {
      const threadService = prepareServices();

      const grandparentId = generateId();
      const parentId = generateId();
      const grandchildId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: grandparentId,
          content: 'Grandparent',
          authorId: TEST_AUTHOR_ID,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: parentId,
          content: 'Parent',
          authorId: TEST_AUTHOR_ID,
          parentId: grandparentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: grandchildId,
          content: 'Grandchild',
          authorId: TEST_AUTHOR_ID,
          parentId: parentId,
          depth: 2,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await threadService.getChildren(grandparentId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(parentId);
    });
  });
});
