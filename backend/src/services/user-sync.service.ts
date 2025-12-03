import { profiles } from '../models/profile.schema';
import { externalIdentities } from '../models/external-identity.schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../utils/id-generator';
import type { Database } from '../db';

export interface SyncUserDto {
  provider: 'CLERK' | 'AUTH0' | 'GOOGLE' | 'GITHUB';
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  providerCreatedAt?: string;
  providerUpdatedAt?: string;
}

export interface SyncResult {
  synced: boolean;
  profileId: string;
  identityId: string;
}

export class UserSyncService {
  private db: Database;

  constructor({ db: _db }: { db: Database }) {
    this.db = _db;
  }

  async syncUser(dto: SyncUserDto): Promise<SyncResult> {
    // NOTE: Find existing identity by provider and providerUserId
    const [existingIdentity] = await this.db
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, dto.provider),
          eq(externalIdentities.providerUserId, dto.providerUserId)
        )
      )
      .limit(1);

    const now = new Date();

    if (existingIdentity) {
      // NOTE: Update existing identity and profile
      await this.db
        .update(externalIdentities)
        .set({
          email: dto.email,
          emailVerified: dto.emailVerified,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          providerUpdatedAt: dto.providerUpdatedAt ? new Date(dto.providerUpdatedAt) : null,
          lastSyncedAt: now,
        })
        .where(eq(externalIdentities.id, existingIdentity.id));

      // NOTE: Update profile if displayName or avatarUrl changed
      if (dto.displayName || dto.avatarUrl) {
        const updateData: Partial<typeof profiles.$inferInsert> = {
          updatedAt: now,
        };
        if (dto.displayName) updateData.displayName = dto.displayName;
        if (dto.avatarUrl) updateData.avatarUrl = dto.avatarUrl;

        await this.db
          .update(profiles)
          .set(updateData)
          .where(eq(profiles.id, existingIdentity.profileId));
      }

      return {
        synced: true,
        profileId: existingIdentity.profileId,
        identityId: existingIdentity.id,
      };
    }

    // NOTE: Create new profile and identity
    const profileId = generateId();
    const identityId = generateId();

    await this.db.insert(profiles).values({
      id: profileId,
      displayName: dto.displayName || 'User',
      bio: null,
      avatarUrl: dto.avatarUrl,
      preferences: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.db.insert(externalIdentities).values({
      id: identityId,
      provider: dto.provider,
      providerUserId: dto.providerUserId,
      profileId,
      email: dto.email,
      emailVerified: dto.emailVerified,
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      providerCreatedAt: dto.providerCreatedAt ? new Date(dto.providerCreatedAt) : null,
      providerUpdatedAt: dto.providerUpdatedAt ? new Date(dto.providerUpdatedAt) : null,
      lastSyncedAt: now,
    });

    return {
      synced: true,
      profileId,
      identityId,
    };
  }

  async getProfileByProviderUserId({
    provider,
    providerUserId,
  }: {
    provider: string;
    providerUserId: string;
  }) {
    const [identity] = await this.db
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, provider),
          eq(externalIdentities.providerUserId, providerUserId)
        )
      )
      .limit(1);

    if (!identity) return null;

    const [profile] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, identity.profileId))
      .limit(1);

    return profile || null;
  }
}
