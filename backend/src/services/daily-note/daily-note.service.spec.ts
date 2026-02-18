import { describe, it, expect, beforeEach } from 'vitest';
import '../../../tests/preload';
import { db, notes, mentions, profiles, dailyNotes, templates, channels } from '../../db';
import { createDailyNoteService } from '.';

const TEST_AUTHOR_ID = 'test-author-id';
const TEST_CHANNEL_ID = 'test-channel-id';

describe('DailyNoteService', () => {
  const prepareServices = () => {
    const service = createDailyNoteService({ db });
    return { service };
  };

  beforeEach(async () => {
    await db.delete(mentions);
    await db.delete(dailyNotes);
    await db.delete(notes);
    await db.delete(templates);
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

  describe('getDailyNote', () => {
    it('should create a daily note with the correct authorId and channelId', async () => {
      const { service } = prepareServices();
      const today = '2026-02-16';

      const result = await service.getDailyNote(TEST_AUTHOR_ID, today, TEST_CHANNEL_ID);
      expect(result.isOk()).toBe(true);

      const { note } = result._unsafeUnwrap();
      expect(note.authorId).toBe(TEST_AUTHOR_ID);
      expect(note.channelId).toBe(TEST_CHANNEL_ID);
    });

    it('should return existing daily note on second call', async () => {
      const { service } = prepareServices();
      const today = '2026-02-16';

      const first = await service.getDailyNote(TEST_AUTHOR_ID, today, TEST_CHANNEL_ID);
      const second = await service.getDailyNote(TEST_AUTHOR_ID, today, TEST_CHANNEL_ID);

      expect(first.isOk()).toBe(true);
      expect(second.isOk()).toBe(true);

      const firstNote = first._unsafeUnwrap().note;
      const secondNote = second._unsafeUnwrap().note;
      expect(firstNote.id).toBe(secondNote.id);
      expect(secondNote.authorId).toBe(TEST_AUTHOR_ID);
    });
  });
});
