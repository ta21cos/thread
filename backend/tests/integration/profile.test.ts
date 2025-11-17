import { describe, it, expect, beforeEach } from 'vitest';
import { db, profiles } from '../../src/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// NOTE: Integration tests for profiles schema
describe('Profile Schema', () => {
  beforeEach(async () => {
    await db.delete(profiles);
  });

  it('should create a profile with all fields', async () => {
    const profileId = randomUUID();
    const now = new Date();

    const [profile] = await db
      .insert(profiles)
      .values({
        id: profileId,
        displayName: 'Test User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        preferences: { theme: 'dark', language: 'en' },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    expect(profile.id).toBe(profileId);
    expect(profile.displayName).toBe('Test User');
    expect(profile.bio).toBe('Test bio');
    expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(profile.preferences).toEqual({ theme: 'dark', language: 'en' });
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('should create a profile with minimal required fields', async () => {
    const profileId = randomUUID();

    const [profile] = await db
      .insert(profiles)
      .values({
        id: profileId,
        displayName: 'Minimal User',
      })
      .returning();

    expect(profile.id).toBe(profileId);
    expect(profile.displayName).toBe('Minimal User');
    expect(profile.bio).toBeNull();
    expect(profile.avatarUrl).toBeNull();
    expect(profile.preferences).toBeNull();
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('should update profile fields', async () => {
    const profileId = randomUUID();

    await db.insert(profiles).values({
      id: profileId,
      displayName: 'Original Name',
    });

    const [updated] = await db
      .update(profiles)
      .set({
        displayName: 'Updated Name',
        bio: 'Updated bio',
      })
      .where(eq(profiles.id, profileId))
      .returning();

    expect(updated.displayName).toBe('Updated Name');
    expect(updated.bio).toBe('Updated bio');
  });

  it('should delete a profile', async () => {
    const profileId = randomUUID();

    await db.insert(profiles).values({
      id: profileId,
      displayName: 'To Delete',
    });

    await db.delete(profiles).where(eq(profiles.id, profileId));

    const result = await db.select().from(profiles).where(eq(profiles.id, profileId));
    expect(result).toHaveLength(0);
  });
});
