import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes, mentions } from '../db';
import { NoteService } from './note.service';
import { generateId } from '../utils/id-generator';

describe('NoteService', () => {
  let noteService: NoteService;

  beforeEach(async () => {
    // Clean database before each test
    await db.delete(mentions);
    await db.delete(notes);
    noteService = new NoteService();
  });

  describe('getNoteById', () => {
    it('should return a note when it exists', async () => {
      // Arrange: Insert a note directly into the database
      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Test note content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Act
      const result = await noteService.getNoteById(noteId);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(noteId);
      expect(result!.content).toBe('Test note content');
      expect(result!.depth).toBe(0);
      expect(result!.parentId).toBeNull();
    });

    it('should return undefined when note does not exist', async () => {
      // Act
      const result = await noteService.getNoteById('notexist');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return a child note with correct parentId and depth', async () => {
      // Arrange: Create parent and child notes
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

      // Act
      const result = await noteService.getNoteById(childId);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(childId);
      expect(result!.parentId).toBe(parentId);
      expect(result!.depth).toBe(1);
    });
  });

  describe('getRootNotes', () => {
    it('should return empty result when no notes exist', async () => {
      // Act
      const result = await noteService.getRootNotes();

      // Assert
      expect(result.notes).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should return only root notes (depth=0)', async () => {
      // Arrange: Create root notes and child notes
      const rootId1 = generateId();
      const rootId2 = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: rootId1,
          content: 'Root note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: rootId2,
          content: 'Root note 2',
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        },
        {
          id: childId,
          content: 'Child note',
          parentId: rootId1,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // Act
      const result = await noteService.getRootNotes();

      // Assert
      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notes.every((n) => n.parentId === null)).toBe(true);
    });

    it('should include replyCount for each root note', async () => {
      // Arrange: Create a root note with 2 replies
      const rootId = generateId();
      const now = new Date();

      await db.insert(notes).values({
        id: rootId,
        content: 'Root note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(notes).values([
        {
          id: generateId(),
          content: 'Reply 1',
          parentId: rootId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Reply 2',
          parentId: rootId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // Act
      const result = await noteService.getRootNotes();

      // Assert
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].replyCount).toBe(2);
    });

    it('should respect limit parameter', async () => {
      // Arrange: Create 5 root notes
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        await db.insert(notes).values({
          id: generateId(),
          content: `Note ${i}`,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + i * 1000),
          updatedAt: now,
        });
      }

      // Act
      const result = await noteService.getRootNotes(3);

      // Assert
      expect(result.notes).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should respect offset parameter', async () => {
      // Arrange: Create 5 root notes with different timestamps
      const now = new Date();
      const noteIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const id = generateId();
        noteIds.push(id);
        await db.insert(notes).values({
          id,
          content: `Note ${i}`,
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() + i * 1000),
          updatedAt: now,
        });
      }

      // Act: Get notes with offset 2
      const result = await noteService.getRootNotes(10, 2);

      // Assert
      expect(result.notes).toHaveLength(3);
      expect(result.hasMore).toBe(false);
    });

    it('should order notes by createdAt descending', async () => {
      // Arrange: Create notes with different timestamps
      const now = new Date();
      const oldNoteId = generateId();
      const newNoteId = generateId();

      await db.insert(notes).values([
        {
          id: oldNoteId,
          content: 'Old note',
          parentId: null,
          depth: 0,
          createdAt: new Date(now.getTime() - 10000),
          updatedAt: now,
        },
        {
          id: newNoteId,
          content: 'New note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      // Act
      const result = await noteService.getRootNotes();

      // Assert
      expect(result.notes[0].id).toBe(newNoteId);
      expect(result.notes[1].id).toBe(oldNoteId);
    });
  });
});
