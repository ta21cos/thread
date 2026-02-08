/**
 * Channel Service Implementation
 *
 * チャネルサービスの実装。
 */

import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import { type Channel, type Database } from '../../db';
import { type NoteError, channelNotFoundError, validationError } from '../../errors/domain-errors';
import { createChannelRepository } from '../../repositories/channel.repository';
import { ensureExists } from '../../repositories/helpers';
import { generateId } from '../../utils/id-generator';
import type { ChannelServiceHandle } from './types';

// ==========================================
// Constants
// ==========================================

const DEFAULT_CHANNEL_NAME = 'General';
const DEFAULT_CHANNEL_COLOR = '#6366f1';
const MAX_CHANNEL_NAME_LENGTH = 50;

// ==========================================
// Validation
// ==========================================

const validateChannelName = (name: string): ResultAsync<string, NoteError> => {
  if (!name || name.trim().length === 0) {
    return errAsync(validationError('Channel name cannot be empty', 'name'));
  }
  if (name.length > MAX_CHANNEL_NAME_LENGTH) {
    return errAsync(
      validationError(`Channel name must be at most ${MAX_CHANNEL_NAME_LENGTH} characters`, 'name')
    );
  }
  return okAsync(name.trim());
};

// ==========================================
// Handle Implementation (Factory)
// ==========================================

export const createChannelService = ({ db }: { db: Database }): ChannelServiceHandle => {
  const channelRepo = createChannelRepository({ db });
  const ensureChannelExists = ensureExists<Channel>(channelNotFoundError);

  return {
    createChannel: (authorId, input) =>
      validateChannelName(input.name).andThen((name) =>
        channelRepo.create({
          id: generateId(),
          authorId,
          name,
          color: input.color ?? DEFAULT_CHANNEL_COLOR,
          icon: input.icon ?? 'hash',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),

    getChannelById: (id) => channelRepo.findById(id).andThen(ensureChannelExists(id)),

    getChannelsByAuthor: (authorId) => channelRepo.findByAuthorId(authorId),

    updateChannel: (id, input) =>
      channelRepo
        .findById(id)
        .andThen(ensureChannelExists(id))
        .andThen(() => {
          if (input.name) {
            return validateChannelName(input.name).map((name) => ({ ...input, name }));
          }
          return okAsync(input);
        })
        .andThen((validatedInput) =>
          channelRepo.update(id, {
            name: validatedInput.name,
            color: validatedInput.color,
            icon: validatedInput.icon,
            sortOrder: validatedInput.sortOrder,
          })
        ),

    deleteChannel: (id) =>
      channelRepo
        .findById(id)
        .andThen(ensureChannelExists(id))
        .andThen(() => channelRepo.delete(id)),

    ensureDefaultChannel: (authorId) =>
      channelRepo.findByAuthorAndName(authorId, DEFAULT_CHANNEL_NAME).andThen((existing) => {
        if (existing) {
          return okAsync(existing);
        }
        return channelRepo.create({
          id: generateId(),
          authorId,
          name: DEFAULT_CHANNEL_NAME,
          color: DEFAULT_CHANNEL_COLOR,
          icon: 'hash',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

export const createMockChannelService = (
  overrides: Partial<ChannelServiceHandle> = {}
): ChannelServiceHandle => ({
  createChannel: () => errAsync(channelNotFoundError('mock')),
  getChannelById: () => errAsync(channelNotFoundError('mock')),
  getChannelsByAuthor: () => okAsync([]),
  updateChannel: () => errAsync(channelNotFoundError('mock')),
  deleteChannel: () => okAsync(undefined),
  ensureDefaultChannel: () => errAsync(channelNotFoundError('mock')),
  ...overrides,
});
