/**
 * Integration tests for users routes
 *
 * Tests the actual HTTP endpoints for user synchronization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';
import usersRoutes from '../../src/api/routes/users';
import { errorHandler } from '../../src/api/middleware/error';
import { generateId } from '../../src/domain/utils/id-generator';

// NOTE: Mock the getClerkClient function
const mockAuthenticateRequest = vi.fn();
const mockClerkClient: Partial<ClerkClient> = {
  authenticateRequest: mockAuthenticateRequest,
};

vi.mock('../../src/auth/clerk', () => ({
  getClerkClient: () => mockClerkClient,
}));

type TestBindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  APP_DOMAIN: string;
};

describe('Users Routes Integration Tests', () => {
  let app: Hono<{ Bindings: TestBindings }>;

  // Helper to clear tables
  const clearTables = async () => {
    await env.DB.exec('DELETE FROM external_identities');
    await env.DB.exec('DELETE FROM profiles');
  };

  // Helper to insert a profile directly via D1
  const insertProfile = async (profile: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    preferences: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO profiles (id, display_name, bio, avatar_url, preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        profile.id,
        profile.displayName,
        profile.bio,
        profile.avatarUrl,
        profile.preferences,
        Math.floor(profile.createdAt.getTime() / 1000),
        Math.floor(profile.updatedAt.getTime() / 1000)
      )
      .run();
  };

  // Helper to insert an external identity directly via D1
  const insertExternalIdentity = async (identity: {
    id: string;
    provider: string;
    providerUserId: string;
    profileId: string;
    email: string | null;
    emailVerified: boolean | null;
    metadata: string | null;
    providerCreatedAt: Date | null;
    providerUpdatedAt: Date | null;
    lastSyncedAt: Date;
  }) => {
    await env.DB.prepare(
      'INSERT INTO external_identities (id, provider, provider_user_id, profile_id, email, email_verified, metadata, provider_created_at, provider_updated_at, last_synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        identity.id,
        identity.provider,
        identity.providerUserId,
        identity.profileId,
        identity.email,
        identity.emailVerified ? 1 : 0,
        identity.metadata,
        identity.providerCreatedAt ? Math.floor(identity.providerCreatedAt.getTime() / 1000) : null,
        identity.providerUpdatedAt ? Math.floor(identity.providerUpdatedAt.getTime() / 1000) : null,
        Math.floor(identity.lastSyncedAt.getTime() / 1000)
      )
      .run();
  };

  // Helper to query profiles
  const queryProfile = async (id: string) => {
    return env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(id)
      .first<{ id: string; display_name: string; avatar_url: string | null }>();
  };

  // Helper to query external identities
  const queryIdentity = async (provider: string, providerUserId: string) => {
    return env.DB.prepare(
      'SELECT * FROM external_identities WHERE provider = ? AND provider_user_id = ?'
    )
      .bind(provider, providerUserId)
      .first<{ id: string; profile_id: string; email: string | null }>();
  };

  beforeEach(async () => {
    // Clear database before each test
    await clearTables();

    // Reset mocks
    vi.clearAllMocks();

    // Mock authentication to succeed by default
    mockAuthenticateRequest.mockResolvedValue({
      isAuthenticated: true,
      toAuth: () => ({ userId: 'test_user_123', sessionId: 'test_session_456' }),
    });

    // Create a fresh Hono app with the users routes
    app = new Hono<{ Bindings: TestBindings }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.route('/api/users', usersRoutes as any);
    app.onError(errorHandler);
  });

  // Helper function to make requests with env bindings
  const requestWithEnv = async (path: string, options: RequestInit = {}) => {
    const testEnv: TestBindings = {
      DB: env.DB,
      CLERK_SECRET_KEY: 'sk_test_mock',
      CLERK_PUBLISHABLE_KEY: 'pk_test_mock',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      APP_DOMAIN: 'http://localhost:3000',
    };
    return app.request(path, options, testEnv);
  };

  describe('POST /api/users/sync', () => {
    it('should create new user with profile and identity', async () => {
      const res = await requestWithEnv('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'CLERK',
          providerUserId: 'clerk_user_123',
          email: 'test@example.com',
          emailVerified: true,
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.png',
        }),
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body).toMatchObject({
        synced: true,
      });
      expect(body.profileId).toBeDefined();
      expect(body.identityId).toBeDefined();

      // Verify profile was created
      const profile = await queryProfile(body.profileId);
      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('Test User');
      expect(profile?.avatar_url).toBe('https://example.com/avatar.png');

      // Verify identity was created
      const identity = await queryIdentity('CLERK', 'clerk_user_123');
      expect(identity).toBeDefined();
      expect(identity?.email).toBe('test@example.com');
      expect(identity?.profile_id).toBe(body.profileId);
    });

    it('should update existing user', async () => {
      // Create existing profile and identity
      const profileId = generateId();
      const identityId = generateId();
      const now = new Date();

      await insertProfile({
        id: profileId,
        displayName: 'Old Name',
        bio: null,
        avatarUrl: null,
        preferences: null,
        createdAt: now,
        updatedAt: now,
      });

      await insertExternalIdentity({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'clerk_user_456',
        profileId: profileId,
        email: 'old@example.com',
        emailVerified: false,
        metadata: null,
        providerCreatedAt: null,
        providerUpdatedAt: null,
        lastSyncedAt: now,
      });

      const res = await requestWithEnv('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'CLERK',
          providerUserId: 'clerk_user_456',
          email: 'new@example.com',
          emailVerified: true,
          displayName: 'New Name',
          avatarUrl: 'https://example.com/new-avatar.png',
        }),
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body).toMatchObject({
        synced: true,
        profileId: profileId,
        identityId: identityId,
      });

      // Verify profile was updated
      const profile = await queryProfile(profileId);
      expect(profile?.display_name).toBe('New Name');
      expect(profile?.avatar_url).toBe('https://example.com/new-avatar.png');

      // Verify identity was updated
      const identity = await queryIdentity('CLERK', 'clerk_user_456');
      expect(identity?.email).toBe('new@example.com');
    });

    it('should create user with minimal data', async () => {
      const res = await requestWithEnv('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'CLERK',
          providerUserId: 'clerk_user_minimal',
        }),
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.synced).toBe(true);

      // Verify profile was created with default display name
      const profile = await queryProfile(body.profileId);
      expect(profile?.display_name).toBe('User');
    });

    it('should support different providers', async () => {
      const providers = ['CLERK', 'AUTH0', 'GOOGLE', 'GITHUB'];

      for (const provider of providers) {
        const res = await requestWithEnv('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            providerUserId: `${provider.toLowerCase()}_user_123`,
          }),
        });

        expect(res.status).toBe(200);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.synced).toBe(true);
      }
    });

    describe('validation', () => {
      it('should return 400 when provider is missing', async () => {
        const res = await requestWithEnv('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerUserId: 'user_123',
          }),
        });

        expect(res.status).toBe(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.error).toBe('Bad Request');
      });

      it('should return 400 when providerUserId is missing', async () => {
        const res = await requestWithEnv('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'CLERK',
          }),
        });

        expect(res.status).toBe(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.error).toBe('Bad Request');
      });

      it('should return 400 for invalid provider', async () => {
        const res = await requestWithEnv('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'INVALID_PROVIDER',
            providerUserId: 'user_123',
          }),
        });

        expect(res.status).toBe(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await res.json()) as any;
        expect(body.error).toBe('Bad Request');
        expect(body.message).toContain('Invalid provider');
      });
    });

    it('should handle metadata field', async () => {
      const metadata = { custom_field: 'value', number: 42 };

      const res = await requestWithEnv('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'CLERK',
          providerUserId: 'clerk_user_with_metadata',
          metadata,
        }),
      });

      expect(res.status).toBe(200);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await res.json()) as any;
      expect(body.synced).toBe(true);
    });
  });
});
