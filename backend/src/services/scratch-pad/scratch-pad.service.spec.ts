import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions, profiles, scratchPads, channels } from '../../db';
import { createScratchPadService } from '.';

const TEST_AUTHOR_ID = 'test-author-id';
const TEST_CHANNEL_ID = 'test-channel-id';

describe('ScratchPadService', () => {
  const prepareServices = () => {
    const service = createScratchPadService({ db });
    return { service };
  };

  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(notes);
    await db.delete(scratchPads);
    await db.delete(channels);
    await db.delete(profiles);
    await db.insert(profiles).values({
      id: TEST_AUTHOR_ID,
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(channels).values({
      id: TEST_CHANNEL_ID,
      authorId: TEST_AUTHOR_ID,
      name: 'Test Channel',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('convertToNote', () => {
    it('should create a note with the correct authorId and channelId', async () => {
      const { service } = prepareServices();

      await service.updateScratchPad(TEST_AUTHOR_ID, 'Scratch pad content', TEST_CHANNEL_ID);

      const result = await service.convertToNote(TEST_AUTHOR_ID, TEST_CHANNEL_ID);
      expect(result.isOk()).toBe(true);

      const note = result._unsafeUnwrap();
      expect(note.authorId).toBe(TEST_AUTHOR_ID);
      expect(note.channelId).toBe(TEST_CHANNEL_ID);
      expect(note.content).toBe('Scratch pad content');
    });

    it('should fail when scratch pad is empty', async () => {
      const { service } = prepareServices();

      const result = await service.convertToNote(TEST_AUTHOR_ID, TEST_CHANNEL_ID);
      expect(result.isErr()).toBe(true);
    });
  });
});
