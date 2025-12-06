import { createNoteRepository, type NoteRepository } from '../repositories/note.repository';
import type { Note, Database } from '../db';

// NOTE: Service for thread hierarchy management
export class ThreadService {
  private noteRepo: NoteRepository;

  constructor({ db }: { db: Database }) {
    this.noteRepo = createNoteRepository({ db });
  }

  async getThread(noteId: string): Promise<Note[]> {
    const noteResult = await this.noteRepo.findById(noteId);
    if (noteResult.isErr()) {
      throw new Error(noteResult.error.message);
    }
    const note = noteResult.value;
    if (!note) {
      throw new Error('Note not found');
    }

    // Find root of thread
    let rootId = noteId;
    let current = note;

    while (current.parentId) {
      const parentResult = await this.noteRepo.findById(current.parentId);
      if (parentResult.isErr() || !parentResult.value) break;
      current = parentResult.value;
      rootId = current.id;
    }

    // Get full thread from root
    const threadResult = await this.noteRepo.getThreadRecursive(rootId);
    if (threadResult.isErr()) {
      throw new Error(threadResult.error.message);
    }
    return threadResult.value;
  }

  async getChildren(noteId: string): Promise<Note[]> {
    const childrenResult = await this.noteRepo.findByParentId(noteId);
    if (childrenResult.isErr()) {
      throw new Error(childrenResult.error.message);
    }
    return childrenResult.value;
  }
}
