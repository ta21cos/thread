/**
 * Scratch Pad Service Implementation
 */

import { okAsync, errAsync } from 'neverthrow';
import { type Database } from '../../db';
import { contentEmptyError } from '../../errors/domain-errors';
import { createScratchPadRepository } from '../../repositories/scratch-pad.repository';
import { getOrCreate } from '../../repositories/helpers';
import { createNoteService } from '../note';
import { generateId } from '../../utils/id-generator';
import type { ScratchPadServiceHandle } from './types';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

export const createScratchPadService = ({ db }: { db: Database }): ScratchPadServiceHandle => {
  const scratchPadRepo = createScratchPadRepository({ db });
  const noteService = createNoteService({ db });

  const createEmptyScratchPad = (authorId: string, channelId: string) =>
    scratchPadRepo.create({
      id: generateId(),
      authorId,
      channelId,
      content: '',
      updatedAt: new Date(),
    });

  return {
    getScratchPad: (authorId, channelId) =>
      scratchPadRepo
        .findByAuthorAndChannel(authorId, channelId)
        .andThen(getOrCreate(() => createEmptyScratchPad(authorId, channelId))),

    updateScratchPad: (authorId, content, channelId) =>
      scratchPadRepo.findByAuthorAndChannel(authorId, channelId).andThen((existing) =>
        existing
          ? scratchPadRepo.update(existing.id, content)
          : scratchPadRepo.create({
              id: generateId(),
              authorId,
              channelId,
              content,
              updatedAt: new Date(),
            })
      ),

    convertToNote: (authorId, channelId) =>
      scratchPadRepo
        .findByAuthorAndChannel(authorId, channelId)
        .andThen((scratchPad) =>
          !scratchPad || !scratchPad.content.trim()
            ? errAsync(contentEmptyError())
            : noteService
                .createNote({ content: scratchPad.content, authorId, channelId, isHidden: false })
                .andThen((note) => scratchPadRepo.update(scratchPad.id, '').map(() => note))
        ),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

export const createMockScratchPadService = (
  overrides: Partial<ScratchPadServiceHandle> = {}
): ScratchPadServiceHandle => ({
  getScratchPad: () =>
    okAsync({
      id: 'mock',
      authorId: 'mock',
      channelId: 'mock-ch',
      content: '',
      updatedAt: new Date(),
    }),
  updateScratchPad: () =>
    okAsync({
      id: 'mock',
      authorId: 'mock',
      channelId: 'mock-ch',
      content: '',
      updatedAt: new Date(),
    }),
  convertToNote: () => errAsync(contentEmptyError()),
  ...overrides,
});
