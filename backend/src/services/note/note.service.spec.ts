import { describe, it, expect, beforeEach } from 'vitest';
// NOTE: Initialize database before importing db
import '../../../tests/preload';
import { db, notes, mentions } from '../../db';

import { generateId } from '../../utils/id-generator';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import { createNoteService } from '.';

describe('NoteService', () => {
  const prepareServices = async () => {
    const service = createNoteService({ db });

    // ResultAsyncをPromiseに変換するラッパー
    const noteService = {
      createNote: async (input: { content: string; parentId?: string; isHidden?: boolean }) => {
        const result = await service.createNote(input);
        return result.match(
          (note) => note,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      getNoteById: async (id: string) => {
        const result = await service.getNoteById(id);
        return result.match(
          (note) => note,
          (error) => {
            // NoteNotFoundErrorの場合はundefinedを返す（テストの期待に合わせる）
            if (error._tag === 'NoteNotFoundError') {
              return undefined;
            }
            throw new Error(error.message);
          }
        );
      },
      getRootNotes: async (limit?: number, offset?: number, includeHidden?: boolean) => {
        const result = await service.getRootNotes(limit, offset, includeHidden);
        return result.match(
          (data) => data,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      updateNote: async (id: string, input: { content: string }) => {
        const result = await service.updateNote(id, input);
        return result.match(
          (note) => note,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
      deleteNote: async (id: string) => {
        const result = await service.deleteNote(id);
        return result.match(
          () => undefined,
          (error) => {
            throw new Error(error.message);
          }
        );
      },
    };

    return { noteService };
  };

  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(notes);
  });

  describe('createNote', () => {
    it('should create a root note with valid content', async () => {
      const { noteService } = await prepareServices();

      const result = await noteService.createNote({
        content: 'Test note content',
      });

      expect(result).toBeDefined();
      expect(result.content).toBe('Test note content');
      expect(result.parentId).toBeNull();
      expect(result.depth).toBe(0);
    });

    it('should create a child note with parentId', async () => {
      const { noteService } = await prepareServices();

      const parentId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await noteService.createNote({
        content: 'Child note',
        parentId: parentId,
      });

      expect(result).toBeDefined();
      expect(result.content).toBe('Child note');
      expect(result.parentId).toBe(parentId);
      expect(result.depth).toBe(1);
    });

    it('should throw error when content is empty', async () => {
      const { noteService } = await prepareServices();

      await expect(noteService.createNote({ content: '' })).rejects.toThrow(
        'Note content cannot be empty'
      );
    });

    it('should throw error when content exceeds max length', async () => {
      const { noteService } = await prepareServices();

      const longContent = 'a'.repeat(MAX_NOTE_LENGTH + 1);

      await expect(noteService.createNote({ content: longContent })).rejects.toThrow(
        `Note content must be at most ${MAX_NOTE_LENGTH} characters (got ${MAX_NOTE_LENGTH + 1})`
      );
    });

    it('should allow content at max length', async () => {
      const { noteService } = await prepareServices();

      const maxContent = 'a'.repeat(MAX_NOTE_LENGTH);

      const result = await noteService.createNote({ content: maxContent });

      expect(result).toBeDefined();
      expect(result.content).toBe(maxContent);
    });

    it('should throw error when parent note does not exist', async () => {
      const { noteService } = await prepareServices();

      await expect(
        noteService.createNote({
          content: 'Child note',
          parentId: 'nonexistent',
        })
      ).rejects.toThrow("Parent note with id 'nonexistent' not found");
    });

    it('should enforce 2-level constraint - cannot create child of child', async () => {
      const { noteService } = await prepareServices();

      const rootId = generateId();
      const childId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: rootId,
          content: 'Root note',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childId,
          content: 'Child note',
          parentId: rootId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await expect(
        noteService.createNote({
          content: 'Grandchild note',
          parentId: childId,
        })
      ).rejects.toThrow('Cannot create child for a note that is already at maximum depth (1)');
    });

    it('should create mentions when content contains @mentions', async () => {
      const { noteService } = await prepareServices();

      const targetNoteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: targetNoteId,
        content: 'Target note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await noteService.createNote({
        content: `Mentioning @${targetNoteId} here`,
      });

      expect(result).toBeDefined();

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(1);
      expect(mentionRecords[0].fromNoteId).toBe(result.id);
      expect(mentionRecords[0].toNoteId).toBe(targetNoteId);
    });

    it('should create multiple mentions for multiple @mentions', async () => {
      const { noteService } = await prepareServices();

      const targetNoteId1 = generateId();
      const targetNoteId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: targetNoteId1,
          content: 'Target note 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: targetNoteId2,
          content: 'Target note 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await noteService.createNote({
        content: `Mentioning @${targetNoteId1} and @${targetNoteId2}`,
      });

      expect(result).toBeDefined();

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(2);
    });

    it('should store correct position for mentions', async () => {
      const { noteService } = await prepareServices();

      const targetNoteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: targetNoteId,
        content: 'Target note',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await noteService.createNote({
        content: `Hello @${targetNoteId}`,
      });

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(1);
      expect(mentionRecords[0].position).toBe(6);
    });
  });

  describe('getNoteById', () => {
    it('should return a note when it exists', async () => {
      const { noteService } = await prepareServices();

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

      const result = await noteService.getNoteById(noteId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(noteId);
      expect(result!.content).toBe('Test note content');
      expect(result!.depth).toBe(0);
      expect(result!.parentId).toBeNull();
    });

    it('should return undefined when note does not exist', async () => {
      const { noteService } = await prepareServices();

      const result = await noteService.getNoteById('notexist');

      expect(result).toBeUndefined();
    });

    it('should return a child note with correct parentId and depth', async () => {
      const { noteService } = await prepareServices();

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

      const result = await noteService.getNoteById(childId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(childId);
      expect(result!.parentId).toBe(parentId);
      expect(result!.depth).toBe(1);
    });
  });

  describe('getRootNotes', () => {
    it('should return empty result when no notes exist', async () => {
      const { noteService } = await prepareServices();

      const result = await noteService.getRootNotes();

      expect(result.notes).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should return only root notes (depth=0)', async () => {
      const { noteService } = await prepareServices();

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

      const result = await noteService.getRootNotes();

      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notes.every((n) => n.parentId === null)).toBe(true);
    });

    it('should include replyCount for each root note', async () => {
      const { noteService } = await prepareServices();

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

      const result = await noteService.getRootNotes();

      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].replyCount).toBe(2);
    });

    it('should respect limit parameter', async () => {
      const { noteService } = await prepareServices();
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

      const result = await noteService.getRootNotes(3);

      expect(result.notes).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it('should respect offset parameter', async () => {
      const { noteService } = await prepareServices();
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

      const result = await noteService.getRootNotes(10, 2);

      expect(result.notes).toHaveLength(3);
      expect(result.hasMore).toBe(false);
    });

    it('should order notes by createdAt descending', async () => {
      const { noteService } = await prepareServices();

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

      const result = await noteService.getRootNotes();

      expect(result.notes[0].id).toBe(newNoteId);
      expect(result.notes[1].id).toBe(oldNoteId);
    });
  });

  describe('updateNote', () => {
    it('should update note content', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const result = await noteService.updateNote(noteId, {
        content: 'Updated content',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(noteId);
      expect(result.content).toBe('Updated content');
    });

    it('should throw error when note does not exist', async () => {
      const { noteService } = await prepareServices();

      await expect(
        noteService.updateNote('nonexistent', { content: 'New content' })
      ).rejects.toThrow("Note with id 'nonexistent' not found");
    });

    it('should throw error when content is empty', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      await expect(noteService.updateNote(noteId, { content: '' })).rejects.toThrow(
        'Note content cannot be empty'
      );
    });

    it('should throw error when content exceeds max length', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const longContent = 'a'.repeat(MAX_NOTE_LENGTH + 1);

      await expect(noteService.updateNote(noteId, { content: longContent })).rejects.toThrow(
        `Note content must be at most ${MAX_NOTE_LENGTH} characters (got ${MAX_NOTE_LENGTH + 1})`
      );
    });

    it('should allow content at max length', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: noteId,
        content: 'Original content',
        parentId: null,
        depth: 0,
        createdAt: now,
        updatedAt: now,
      });

      const maxContent = 'a'.repeat(MAX_NOTE_LENGTH);

      const result = await noteService.updateNote(noteId, { content: maxContent });

      expect(result).toBeDefined();
      expect(result.content).toBe(maxContent);
    });

    it('should update mentions when content changes', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const targetNoteId1 = generateId();
      const targetNoteId2 = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId,
          content: `Original @${targetNoteId1}`,
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: targetNoteId1,
          content: 'Target 1',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: targetNoteId2,
          content: 'Target 2',
          parentId: null,
          depth: 0,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await db.insert(mentions).values({
        id: generateId(),
        fromNoteId: noteId,
        toNoteId: targetNoteId1,
        position: 9,
        createdAt: now,
      });

      await noteService.updateNote(noteId, {
        content: `Updated @${targetNoteId2}`,
      });

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(1);
      expect(mentionRecords[0].toNoteId).toBe(targetNoteId2);
    });

    it('should remove all mentions when updated content has no mentions', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const targetNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId,
          content: `Original @${targetNoteId}`,
          parentId: null,
          depth: 0,
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
        fromNoteId: noteId,
        toNoteId: targetNoteId,
        position: 9,
        createdAt: now,
      });

      await noteService.updateNote(noteId, {
        content: 'No mentions here',
      });

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(0);
    });

    it('should add new mentions when updated content has mentions', async () => {
      const { noteService } = await prepareServices();

      const noteId = generateId();
      const targetNoteId = generateId();
      const now = new Date();

      await db.insert(notes).values([
        {
          id: noteId,
          content: 'No mentions',
          parentId: null,
          depth: 0,
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

      await noteService.updateNote(noteId, {
        content: `Now with @${targetNoteId}`,
      });

      const mentionRecords = await db.select().from(mentions);
      expect(mentionRecords).toHaveLength(1);
      expect(mentionRecords[0].fromNoteId).toBe(noteId);
      expect(mentionRecords[0].toNoteId).toBe(targetNoteId);
    });

    it('should preserve parentId and depth when updating', async () => {
      const { noteService } = await prepareServices();

      const parentId = generateId();
      const childId = generateId();
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
          content: 'Child note',
          parentId: parentId,
          depth: 1,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const result = await noteService.updateNote(childId, {
        content: 'Updated child content',
      });

      expect(result.parentId).toBe(parentId);
      expect(result.depth).toBe(1);
    });
  });

  describe('isHidden functionality', () => {
    it('should create a root note with isHidden=true', async () => {
      const { noteService } = await prepareServices();

      const result = await noteService.createNote({
        content: 'Hidden note',
        isHidden: true,
      });

      expect(result).toBeDefined();
      expect(result.content).toBe('Hidden note');
      expect(result.isHidden).toBe(true);
      expect(result.parentId).toBeNull();
    });

    it('should create a root note with isHidden=false by default', async () => {
      const { noteService } = await prepareServices();

      const result = await noteService.createNote({
        content: 'Visible note',
      });

      expect(result).toBeDefined();
      expect(result.isHidden).toBe(false);
    });

    it('should throw error when trying to set isHidden=true on a reply', async () => {
      const { noteService } = await prepareServices();

      const parentId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        isHidden: false,
        createdAt: now,
        updatedAt: now,
      });

      await expect(
        noteService.createNote({
          content: 'Child note',
          parentId: parentId,
          isHidden: true,
        })
      ).rejects.toThrow(
        'Only root notes can be marked as hidden. Replies inherit hidden status from parent.'
      );
    });

    it('should inherit parent isHidden status for replies', async () => {
      const { noteService } = await prepareServices();

      const parentId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: parentId,
        content: 'Hidden parent',
        parentId: null,
        depth: 0,
        isHidden: true,
        createdAt: now,
        updatedAt: now,
      });

      const result = await noteService.createNote({
        content: 'Child note',
        parentId: parentId,
      });

      expect(result).toBeDefined();
      expect(result.isHidden).toBe(true);
      expect(result.parentId).toBe(parentId);
    });

    it('should filter out hidden notes by default in getRootNotes', async () => {
      const { noteService } = await prepareServices();

      const now = new Date();
      await db.insert(notes).values([
        {
          id: generateId(),
          content: 'Visible note 1',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Hidden note',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Visible note 2',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: new Date(now.getTime() + 2000),
          updatedAt: now,
        },
      ]);

      const result = await noteService.getRootNotes();

      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.notes.every((n) => n.isHidden === false)).toBe(true);
    });

    it('should include hidden notes when includeHidden=true', async () => {
      const { noteService } = await prepareServices();

      const now = new Date();
      await db.insert(notes).values([
        {
          id: generateId(),
          content: 'Visible note',
          parentId: null,
          depth: 0,
          isHidden: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: generateId(),
          content: 'Hidden note',
          parentId: null,
          depth: 0,
          isHidden: true,
          createdAt: new Date(now.getTime() + 1000),
          updatedAt: now,
        },
      ]);

      const result = await noteService.getRootNotes(20, 0, true);

      expect(result.notes).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should allow isHidden=false explicitly on replies', async () => {
      const { noteService } = await prepareServices();

      const parentId = generateId();
      const now = new Date();
      await db.insert(notes).values({
        id: parentId,
        content: 'Parent note',
        parentId: null,
        depth: 0,
        isHidden: false,
        createdAt: now,
        updatedAt: now,
      });

      const result = await noteService.createNote({
        content: 'Child note',
        parentId: parentId,
        isHidden: false,
      });

      expect(result).toBeDefined();
      expect(result.isHidden).toBe(false);
    });
  });
});
