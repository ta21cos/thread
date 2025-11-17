import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserSyncService } from '../../src/services/user-sync.service';
import { db } from '../../src/db';
import { profiles } from '../../src/models/profile.schema';
import { externalIdentities } from '../../src/models/external-identity.schema';
import { eq, and } from 'drizzle-orm';

describe('UserSyncService', () => {
  const userSync = new UserSyncService();

  beforeEach(async () => {
    // NOTE: Clean database before each test
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  afterEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  it('should create new profile and identity for new user', async () => {
    const result = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      metadata: {
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(result.synced).toBe(true);
    expect(result.profileId).toBeTruthy();
    expect(result.identityId).toBeTruthy();

    // NOTE: Verify database records
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.profileId));
    expect(profile.displayName).toBe('Test User');
    expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, result.identityId));
    expect(identity.provider).toBe('CLERK');
    expect(identity.providerUserId).toBe('user_test123');
    expect(identity.email).toBe('test@example.com');
    expect(identity.emailVerified).toBe(true);
  });

  it('should update existing user on re-sync (idempotent)', async () => {
    // NOTE: First sync
    const first = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test123',
      displayName: 'Old Name',
      email: 'old@example.com',
    });

    // NOTE: Second sync with updated data
    const second = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test123',
      displayName: 'New Name',
      email: 'new@example.com',
      emailVerified: true,
    });

    // NOTE: Should return same profileId (not duplicate)
    expect(second.profileId).toBe(first.profileId);
    expect(second.identityId).toBe(first.identityId);

    // NOTE: Should update displayName
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, second.profileId));
    expect(profile.displayName).toBe('New Name');

    // NOTE: Should update email
    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, second.identityId));
    expect(identity.email).toBe('new@example.com');
    expect(identity.emailVerified).toBe(true);
  });

  it('should handle missing optional fields gracefully', async () => {
    const result = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test456',
      // NOTE: No email, displayName, etc.
    });

    expect(result.synced).toBe(true);

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.profileId));
    expect(profile.displayName).toBe('User'); // NOTE: Fallback

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, result.identityId));
    expect(identity.email).toBeNull();
  });

  it('should not create duplicate users for same provider and providerUserId', async () => {
    // NOTE: First sync
    await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test789',
      displayName: 'User One',
    });

    // NOTE: Second sync - should update, not create new
    await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_test789',
      displayName: 'User Two',
    });

    // NOTE: Verify only one identity exists
    const identities = await db
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, 'CLERK'),
          eq(externalIdentities.providerUserId, 'user_test789')
        )
      );
    expect(identities.length).toBe(1);

    // NOTE: Verify only one profile exists
    const allProfiles = await db.select().from(profiles);
    expect(allProfiles.length).toBe(1);
  });

  it('should allow same providerUserId for different providers', async () => {
    // NOTE: Same user ID but different providers
    const clerk = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_abc',
      displayName: 'Clerk User',
    });

    const google = await userSync.syncUser({
      provider: 'GOOGLE',
      providerUserId: 'user_abc',
      displayName: 'Google User',
    });

    // NOTE: Should create different profiles
    expect(clerk.profileId).not.toBe(google.profileId);
    expect(clerk.identityId).not.toBe(google.identityId);

    // NOTE: Verify two identities exist
    const identities = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.providerUserId, 'user_abc'));
    expect(identities.length).toBe(2);
  });

  it('should get profile by provider and providerUserId', async () => {
    await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_gettest',
      displayName: 'Get Test User',
      email: 'gettest@example.com',
    });

    const profile = await userSync.getProfileByProviderUserId({
      provider: 'CLERK',
      providerUserId: 'user_gettest',
    });

    expect(profile).toBeTruthy();
    expect(profile?.displayName).toBe('Get Test User');
  });

  it('should return null when profile not found', async () => {
    const profile = await userSync.getProfileByProviderUserId({
      provider: 'CLERK',
      providerUserId: 'user_nonexistent',
    });

    expect(profile).toBeNull();
  });

  it('should store and retrieve metadata as JSON', async () => {
    const metadata = {
      firstName: 'John',
      lastName: 'Doe',
      preferences: { theme: 'dark', language: 'en' },
    };

    const result = await userSync.syncUser({
      provider: 'CLERK',
      providerUserId: 'user_metadata',
      displayName: 'Metadata User',
      metadata,
    });

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, result.identityId));

    expect(identity.metadata).toBeTruthy();
    const storedMetadata = JSON.parse(identity.metadata as string);
    expect(storedMetadata).toEqual(metadata);
  });
});
