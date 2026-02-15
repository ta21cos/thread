/**
 * Bookmark Service Implementation
 */

import { okAsync } from 'neverthrow';
import { type Note, type Database } from '../../db';
import { noteNotFoundError } from '../../errors/domain-errors';
import { createBookmarkRepository } from '../../repositories/bookmark.repository';
import { ensureExists } from '../../repositories/helpers';
import { createNoteRepository } from '../../repositories/note.repository';
import { generateId } from '../../utils/id-generator';
import type { BookmarkServiceHandle } from './types';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

export const createBookmarkService = ({ db }: { db: Database }): BookmarkServiceHandle => {
  const bookmarkRepo = createBookmarkRepository({ db });
  const noteRepo = createNoteRepository({ db });
  const ensureNoteExists = ensureExists<Note>(noteNotFoundError);

  return {
    toggleBookmark: (noteId, authorId) =>
      noteRepo
        .findById(noteId)
        .andThen(ensureNoteExists(noteId))
        .andThen(() =>
          bookmarkRepo
            .findByNoteAndAuthor(noteId, authorId)
            .andThen((existing) =>
              existing
                ? bookmarkRepo.delete(existing.id).map(() => ({ bookmarked: false }))
                : bookmarkRepo
                    .create({ id: generateId(), noteId, authorId, createdAt: new Date() })
                    .map(() => ({ bookmarked: true }))
            )
        ),

    isBookmarked: (noteId, authorId) =>
      bookmarkRepo.findByNoteAndAuthor(noteId, authorId).map((bookmark) => !!bookmark),

    getBookmarks: (authorId, limit = 100) => bookmarkRepo.findByAuthorId(authorId, limit),

    removeBookmark: (noteId, authorId) => bookmarkRepo.deleteByNoteAndAuthor(noteId, authorId),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

export const createMockBookmarkService = (
  overrides: Partial<BookmarkServiceHandle> = {}
): BookmarkServiceHandle => ({
  toggleBookmark: () => okAsync({ bookmarked: false }),
  isBookmarked: () => okAsync(false),
  getBookmarks: () => okAsync([]),
  removeBookmark: () => okAsync(undefined),
  ...overrides,
});
