import { describe, it, expect, beforeEach } from 'vitest';
import { db, profiles, externalIdentities } from '../db';
import { UserSyncService } from './user-sync.service';
import { generateId } from '../utils/id-generator';

describe('UserSyncService', () => {
  const prepareServices = async () => {
    const userSyncService = new UserSyncService();
    return { userSyncService };
  };

  beforeEach(async () => {
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
