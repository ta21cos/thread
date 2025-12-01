import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, profiles, externalIdentities } from '../db';
import { UserSyncService, type SyncUserDto } from './user-sync.service';
import { generateId } from '../utils/id-generator';
import { eq, and } from 'drizzle-orm';

describe('UserSyncService', () => {
  const prepareServices = async () => {
    const userSyncService = new UserSyncService({ db });
    return { userSyncService };
  };

  beforeEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  afterEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  describe('syncUser', () => {
    it('should create new profile and identity for new user', async () => {
      const { userSyncService } = await prepareServices();

      const result = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_123',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(result.synced).toBe(true);
      expect(result.profileId).toBeDefined();
      expect(result.identityId).toBeDefined();

      const [profile] = await db.select().from(profiles).limit(1);
      expect(profile.displayName).toBe('Test User');
      expect(profile.avatarUrl).toBe('https://example.com/avatar.png');

      const [identity] = await db.select().from(externalIdentities).limit(1);
      expect(identity.provider).toBe('CLERK');
      expect(identity.providerUserId).toBe('user_123');
      expect(identity.email).toBe('test@example.com');
    });

    it('should use default display name when not provided', async () => {
      const { userSyncService } = await prepareServices();

      const result = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_456',
        email: 'test@example.com',
        emailVerified: false,
      });

      expect(result.synced).toBe(true);

      const [profile] = await db.select().from(profiles).limit(1);
      expect(profile.displayName).toBe('User');
    });

    it('should update existing identity when user exists', async () => {
      const { userSyncService } = await prepareServices();

      const profileId = generateId();
      const identityId = generateId();
      const now = new Date();

      await db.insert(profiles).values({
        id: profileId,
        displayName: 'Old Name',
        bio: null,
        avatarUrl: 'https://example.com/old-avatar.png',
        preferences: null,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(externalIdentities).values({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'user_existing',
        profileId: profileId,
        email: 'old@example.com',
        emailVerified: false,
        metadata: null,
        providerCreatedAt: null,
        providerUpdatedAt: null,
        lastSyncedAt: now,
      });

      const result = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_existing',
        email: 'new@example.com',
        emailVerified: true,
        displayName: 'New Name',
        avatarUrl: 'https://example.com/new-avatar.png',
      });

      expect(result.synced).toBe(true);
      expect(result.profileId).toBe(profileId);
      expect(result.identityId).toBe(identityId);

      const [identity] = await db.select().from(externalIdentities).limit(1);
      expect(identity.email).toBe('new@example.com');
      expect(identity.emailVerified).toBe(true);

      const [profile] = await db.select().from(profiles).limit(1);
      expect(profile.displayName).toBe('New Name');
      expect(profile.avatarUrl).toBe('https://example.com/new-avatar.png');
    });

    it('should store metadata when provided', async () => {
      const { userSyncService } = await prepareServices();

      const metadata = { role: 'admin', plan: 'premium' };

      await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_meta',
        email: 'meta@example.com',
        emailVerified: true,
        metadata: metadata,
      });

      const [identity] = await db.select().from(externalIdentities).limit(1);
      expect(identity.metadata).toBe(JSON.stringify(metadata));
    });

    it('should handle different providers correctly', async () => {
      const { userSyncService } = await prepareServices();

      await userSyncService.syncUser({
        provider: 'GOOGLE',
        providerUserId: 'google_123',
        email: 'google@example.com',
        emailVerified: true,
      });

      await userSyncService.syncUser({
        provider: 'GITHUB',
        providerUserId: 'github_456',
        email: 'github@example.com',
        emailVerified: true,
      });

      const identities = await db.select().from(externalIdentities);
      expect(identities).toHaveLength(2);
      expect(identities.find((i) => i.provider === 'GOOGLE')).toBeDefined();
      expect(identities.find((i) => i.provider === 'GITHUB')).toBeDefined();
    });

    it('should store provider timestamps when provided', async () => {
      const { userSyncService } = await prepareServices();

      const providerCreatedAt = '2024-01-01T00:00:00Z';
      const providerUpdatedAt = '2024-06-01T00:00:00Z';

      await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_timestamps',
        email: 'time@example.com',
        emailVerified: true,
        providerCreatedAt,
        providerUpdatedAt,
      });

      const [identity] = await db.select().from(externalIdentities).limit(1);
      expect(identity.providerCreatedAt).toBeDefined();
      expect(identity.providerUpdatedAt).toBeDefined();
    });

    it('should not create duplicate users for same provider and providerUserId', async () => {
      const { userSyncService } = await prepareServices();

      await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_test789',
        displayName: 'User One',
      });

      await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_test789',
        displayName: 'User Two',
      });

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

      const allProfiles = await db.select().from(profiles);
      expect(allProfiles.length).toBe(1);
    });

    it('should allow same providerUserId for different providers', async () => {
      const { userSyncService } = await prepareServices();

      const clerk = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_abc',
        displayName: 'Clerk User',
      });

      const google = await userSyncService.syncUser({
        provider: 'GOOGLE',
        providerUserId: 'user_abc',
        displayName: 'Google User',
      });

      expect(clerk.profileId).not.toBe(google.profileId);
      expect(clerk.identityId).not.toBe(google.identityId);

      const identities = await db
        .select()
        .from(externalIdentities)
        .where(eq(externalIdentities.providerUserId, 'user_abc'));
      expect(identities.length).toBe(2);
    });

    it('should handle all supported providers', async () => {
      const { userSyncService } = await prepareServices();

      const providers: SyncUserDto['provider'][] = ['CLERK', 'AUTH0', 'GOOGLE', 'GITHUB'];

      for (const provider of providers) {
        const result = await userSyncService.syncUser({
          provider,
          providerUserId: `user_${provider.toLowerCase()}`,
          displayName: `${provider} User`,
        });

        expect(result.synced).toBe(true);
        expect(result.profileId).toBeTruthy();
        expect(result.identityId).toBeTruthy();
      }

      const allProfiles = await db.select().from(profiles);
      expect(allProfiles.length).toBe(4);

      const allIdentities = await db.select().from(externalIdentities);
      expect(allIdentities.length).toBe(4);
    });

    it('should handle provider timestamps as Date objects', async () => {
      const { userSyncService } = await prepareServices();

      const providerCreatedAt = '2024-01-01T00:00:00Z';
      const providerUpdatedAt = '2024-06-01T00:00:00Z';

      const result = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'user_with_timestamps',
        providerCreatedAt,
        providerUpdatedAt,
      });
      expect(result.synced).toBe(true);

      const allIdentities = await db.select().from(externalIdentities);
      expect(allIdentities.length).toBe(1);
      expect(allIdentities[0].providerCreatedAt).toEqual(new Date(providerCreatedAt));
      expect(allIdentities[0].providerUpdatedAt).toEqual(new Date(providerUpdatedAt));
    });

    it('should create separate profiles for different providers with same email', async () => {
      const { userSyncService } = await prepareServices();

      const email = 'shared@example.com';

      const clerkResult = await userSyncService.syncUser({
        provider: 'CLERK',
        providerUserId: 'clerk_user',
        email,
        displayName: 'Clerk User',
      });

      const googleResult = await userSyncService.syncUser({
        provider: 'GOOGLE',
        providerUserId: 'google_user',
        email,
        displayName: 'Google User',
      });

      expect(googleResult.profileId).not.toBe(clerkResult.profileId);
      expect(googleResult.identityId).not.toBe(clerkResult.identityId);

      const allProfiles = await db.select().from(profiles);
      expect(allProfiles.length).toBe(2);

      const allIdentities = await db.select().from(externalIdentities);
      expect(allIdentities.length).toBe(2);
    });
  });

  describe('getProfileByProviderUserId', () => {
    it('should return null when identity does not exist', async () => {
      const { userSyncService } = await prepareServices();

      const result = await userSyncService.getProfileByProviderUserId({
        provider: 'CLERK',
        providerUserId: 'nonexistent',
      });

      expect(result).toBeNull();
    });

    it('should return profile for existing identity', async () => {
      const { userSyncService } = await prepareServices();

      const profileId = generateId();
      const identityId = generateId();
      const now = new Date();

      await db.insert(profiles).values({
        id: profileId,
        displayName: 'Test User',
        bio: 'Test bio',
        avatarUrl: 'https://example.com/avatar.png',
        preferences: null,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(externalIdentities).values({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'user_profile',
        profileId: profileId,
        email: 'profile@example.com',
        emailVerified: true,
        metadata: null,
        providerCreatedAt: null,
        providerUpdatedAt: null,
        lastSyncedAt: now,
      });

      const result = await userSyncService.getProfileByProviderUserId({
        provider: 'CLERK',
        providerUserId: 'user_profile',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe(profileId);
      expect(result!.displayName).toBe('Test User');
      expect(result!.bio).toBe('Test bio');
    });

    it('should return null for wrong provider', async () => {
      const { userSyncService } = await prepareServices();

      const profileId = generateId();
      const identityId = generateId();
      const now = new Date();

      await db.insert(profiles).values({
        id: profileId,
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        preferences: null,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(externalIdentities).values({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'user_wrong_provider',
        profileId: profileId,
        email: 'wrong@example.com',
        emailVerified: true,
        metadata: null,
        providerCreatedAt: null,
        providerUpdatedAt: null,
        lastSyncedAt: now,
      });

      const result = await userSyncService.getProfileByProviderUserId({
        provider: 'GOOGLE',
        providerUserId: 'user_wrong_provider',
      });

      expect(result).toBeNull();
    });

    it('should return null for wrong providerUserId', async () => {
      const { userSyncService } = await prepareServices();

      const profileId = generateId();
      const identityId = generateId();
      const now = new Date();

      await db.insert(profiles).values({
        id: profileId,
        displayName: 'Test User',
        bio: null,
        avatarUrl: null,
        preferences: null,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(externalIdentities).values({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'user_correct',
        profileId: profileId,
        email: 'correct@example.com',
        emailVerified: true,
        metadata: null,
        providerCreatedAt: null,
        providerUpdatedAt: null,
        lastSyncedAt: now,
      });

      const result = await userSyncService.getProfileByProviderUserId({
        provider: 'CLERK',
        providerUserId: 'user_wrong',
      });

      expect(result).toBeNull();
    });
  });
});
