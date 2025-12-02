import { NoteRepository } from '../repositories/note.repository';
import type { Note, Database } from '../db';

// NOTE: Service for thread hierarchy management
export class ThreadService {
  private noteRepo: NoteRepository;

  constructor({ db }: { db: Database }) {
    this.noteRepo = new NoteRepository({ db });
  }

  async getThread(noteId: string): Promise<Note[]> {
    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Find root of thread
    let rootId = noteId;
    let current = note;

    while (current.parentId) {
      const parent = await this.noteRepo.findById(current.parentId);
      if (!parent) break;
      current = parent;
      rootId = current.id;
    }

    // Get full thread from root
    return this.noteRepo.getThreadRecursive(rootId);
  }

  async getChildren(noteId: string): Promise<Note[]> {
    return this.noteRepo.findByParentId(noteId);
  }
}
