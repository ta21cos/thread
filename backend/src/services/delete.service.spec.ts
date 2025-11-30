import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes, mentions } from '../db';
import { DeleteService } from './delete.service';
import { generateId } from '../utils/id-generator';

describe('DeleteService', () => {
  const prepareServices = async () => {
    const deleteService = new DeleteService();
    return { deleteService };
  };

  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(notes);
  });

  describe('deleteNote', () => {
    it('should delete a root note', async () => {
      const { deleteService } = await prepareServices();

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

      await deleteService.deleteNote(noteId);

      const result = await db.select().from(notes);
      expect(result).toHaveLength(0);
    });

    it('should throw error when note does not exist', async () => {
      const { deleteService } = await prepareServices();

      await expect(deleteService.deleteNote('nonexistent')).rejects.toThrow('Note not found');
    });

    it('should cascade delete child notes', async () => {
      const { deleteService } = await prepareServices();

      const parentId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values({
        id: childId,
        content: 'Child note',
        parentId: parentId,
        depth: 1,
        createdAt: now,
        updatedAt: now,
      });

      await deleteService.deleteNote(parentId);

      const result = await db.select().from(notes);
      expect(result).toHaveLength(0);
    });

    it('should delete mentions for the deleted note', async () => {
      const { deleteService } = await prepareServices();

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
          content: `Note 2 @${noteId1}`,
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
        position: 7,
        createdAt: now,
      });

      await deleteService.deleteNote(noteId2);

      const mentionResult = await db.select().from(mentions);
      expect(mentionResult).toHaveLength(0);
    });

    it('should delete mentions for child notes when parent is deleted', async () => {
      const { deleteService } = await prepareServices();

      const parentId = generateId();
      const childId = generateId();
      const targetNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId,
          content: `Child note @${targetNoteId}`,
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: targetNoteId,
          content: 'Target note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
        id: generateId(),
        fromNoteId: childId,
        toNoteId: targetNoteId,
        position: 11,
        createdAt: now,
      });

      await deleteService.deleteNote(parentId);

      const mentionResult = await db.select().from(mentions);
      expect(mentionResult).toHaveLength(0);

      const noteResult = await db.select().from(notes);
      expect(noteResult).toHaveLength(1);
      expect(noteResult[0].id).toBe(targetNoteId);
    });

    it('should only delete child notes (not grandchildren)', async () => {
      const { deleteService } = await prepareServices();

      const grandparentId = generateId();
      const parentId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: grandparentId,
          content: 'Grandparent note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: parentId,
          content: 'Parent note',
          parentId: grandparentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await deleteService.deleteNote(parentId);

      const result = await db.select().from(notes);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(grandparentId);
    });

    it('should delete multiple child notes', async () => {
      const { deleteService } = await prepareServices();

      const parentId = generateId();
      const childId1 = generateId();
      const childId2 = generateId();
      const childId3 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: parentId,
          content: 'Parent note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId1,
          content: 'Child 1',
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId2,
          content: 'Child 2',
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId3,
          content: 'Child 3',
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await deleteService.deleteNote(parentId);

      const result = await db.select().from(notes);
      expect(result).toHaveLength(0);
    });
  });
});
