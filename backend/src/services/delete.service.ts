import { createNoteRepository, type NoteRepository } from '../repositories/note.repository';
import {
  createMentionRepository,
  type MentionRepository,
} from '../repositories/mention.repository';
import type { Database } from '../db';

// NOTE: Service for cascade deletion logic (application-level)
// NOTE: This service is kept for backward compatibility, but note.service.ts's deleteNote is preferred
export class DeleteService {
  private noteRepo: NoteRepository;
  private mentionRepo: MentionRepository;

  constructor({ db }: { db: Database }) {
    this.noteRepo = createNoteRepository({ db });
    this.mentionRepo = createMentionRepository({ db });
  }

  async deleteNote(id: string): Promise<void> {
    const noteResult = await this.noteRepo.findById(id);
    if (noteResult.isErr()) {
      throw new Error(noteResult.error.message);
    }
    const note = noteResult.value;
    if (!note) {
      throw new Error('Note not found');
    }

    // NOTE: Application-level cascade deletion
    // Get all child notes (only 1 level deep due to 2-level constraint)
    const childrenResult = await this.noteRepo.findByParentId(id);
    if (childrenResult.isErr()) {
      throw new Error(childrenResult.error.message);
    }
    const children = childrenResult.value;

    // Delete mentions for parent and all children
    const deleteParentMentionsResult = await this.mentionRepo.deleteByNoteId(id);
    if (deleteParentMentionsResult.isErr()) {
      throw new Error(deleteParentMentionsResult.error.message);
    }

    for (const child of children) {
      const deleteChildMentionsResult = await this.mentionRepo.deleteByNoteId(child.id);
      if (deleteChildMentionsResult.isErr()) {
        throw new Error(deleteChildMentionsResult.error.message);
      }
    }

    // Delete all child notes
    for (const child of children) {
      const deleteChildResult = await this.noteRepo.delete(child.id);
      if (deleteChildResult.isErr()) {
        throw new Error(deleteChildResult.error.message);
      }
    }

    // Finally delete the parent note
    const deleteParentResult = await this.noteRepo.delete(id);
    if (deleteParentResult.isErr()) {
      throw new Error(deleteParentResult.error.message);
    }
  }
}
