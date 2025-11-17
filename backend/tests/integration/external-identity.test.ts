import { describe, it, expect, beforeEach } from 'vitest';
import { db, profiles, externalIdentities } from '../../src/db';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// NOTE: Integration tests for external_identities schema
describe('External Identity Schema', () => {
  let testProfileId: string;

  beforeEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);

    testProfileId = randomUUID();
    await db.insert(profiles).values({
      id: testProfileId,
      displayName: 'Test User',
    });
  });

  it('should create an external identity with all fields', async () => {
    const identityId = randomUUID();
    const now = new Date();

    const [identity] = await db
      .insert(externalIdentities)
      .values({
        id: identityId,
        provider: 'CLERK',
        providerUserId: 'user_123',
        profileId: testProfileId,
        email: 'test@example.com',
        emailVerified: true,
        metadata: { sub: 'user_123' },
        providerCreatedAt: now,
        providerUpdatedAt: now,
        lastSyncedAt: now,
      })
      .returning();

    expect(identity.id).toBe(identityId);
    expect(identity.provider).toBe('CLERK');
    expect(identity.providerUserId).toBe('user_123');
    expect(identity.profileId).toBe(testProfileId);
    expect(identity.email).toBe('test@example.com');
    expect(identity.emailVerified).toBe(true);
    expect(identity.metadata).toEqual({ sub: 'user_123' });
    expect(identity.lastSyncedAt).toBeInstanceOf(Date);
  });

  it('should create external identity with minimal required fields', async () => {
    const identityId = randomUUID();

    const [identity] = await db
      .insert(externalIdentities)
      .values({
        id: identityId,
        provider: 'GOOGLE',
        providerUserId: 'google_123',
        profileId: testProfileId,
        lastSyncedAt: new Date(),
      })
      .returning();

    expect(identity.id).toBe(identityId);
    expect(identity.provider).toBe('GOOGLE');
    expect(identity.providerUserId).toBe('google_123');
    expect(identity.profileId).toBe(testProfileId);
    expect(identity.email).toBeNull();
    expect(identity.emailVerified).toBeNull();
  });

  it('should enforce unique constraint on (provider, providerUserId)', async () => {
    await db.insert(externalIdentities).values({
      id: randomUUID(),
      provider: 'CLERK',
      providerUserId: 'user_duplicate',
      profileId: testProfileId,
      lastSyncedAt: new Date(),
    });

    let error: Error | undefined;
    try {
      await db.insert(externalIdentities).values({
        id: randomUUID(),
        provider: 'CLERK',
        providerUserId: 'user_duplicate',
        profileId: testProfileId,
        lastSyncedAt: new Date(),
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toMatch(/UNIQUE constraint failed/i);
  });

  it('should allow same providerUserId for different providers', async () => {
    const userId = 'shared_id_123';

    await db.insert(externalIdentities).values({
      id: randomUUID(),
      provider: 'CLERK',
      providerUserId: userId,
      profileId: testProfileId,
      lastSyncedAt: new Date(),
    });

    const [identity] = await db
      .insert(externalIdentities)
      .values({
        id: randomUUID(),
        provider: 'GOOGLE',
        providerUserId: userId,
        profileId: testProfileId,
        lastSyncedAt: new Date(),
      })
      .returning();

    expect(identity.providerUserId).toBe(userId);
    expect(identity.provider).toBe('GOOGLE');
  });

  it('should cascade delete when profile is deleted', async () => {
    const identityId = randomUUID();

    await db.insert(externalIdentities).values({
      id: identityId,
      provider: 'CLERK',
      providerUserId: 'user_cascade',
      profileId: testProfileId,
      lastSyncedAt: new Date(),
    });

    await db.delete(profiles).where(eq(profiles.id, testProfileId));

    const result = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, identityId));

    expect(result).toHaveLength(0);
  });

  it('should support multiple identities for one profile', async () => {
    await db.insert(externalIdentities).values([
      {
        id: randomUUID(),
        provider: 'CLERK',
        providerUserId: 'clerk_123',
        profileId: testProfileId,
        lastSyncedAt: new Date(),
      },
      {
        id: randomUUID(),
        provider: 'GOOGLE',
        providerUserId: 'google_123',
        profileId: testProfileId,
        lastSyncedAt: new Date(),
      },
    ]);

    const identities = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.profileId, testProfileId));

    expect(identities).toHaveLength(2);
  });
});
