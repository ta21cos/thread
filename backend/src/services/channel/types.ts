/**
 * Channel Service Types
 *
 * チャネルサービスの型定義。
 */

import type { ResultAsync } from 'neverthrow';
import type { Channel } from '../../db';
import type { NoteError } from '../../errors/domain-errors';

// ==========================================
// Input Types
// ==========================================

export interface CreateChannelInput {
  readonly name: string;
  readonly color?: string;
  readonly icon?: string;
}

export interface UpdateChannelInput {
  readonly name?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly sortOrder?: number;
}

// ==========================================
// Handle Interface (Public API)
// ==========================================

export interface ChannelServiceHandle {
  /** チャネルを作成 */
  readonly createChannel: (
    authorId: string,
    input: CreateChannelInput
  ) => ResultAsync<Channel, NoteError>;
  /** IDでチャネルを取得 */
  readonly getChannelById: (id: string) => ResultAsync<Channel, NoteError>;
  /** ユーザーのチャネル一覧を取得 */
  readonly getChannelsByAuthor: (authorId: string) => ResultAsync<Channel[], NoteError>;
  /** チャネルを更新 */
  readonly updateChannel: (
    id: string,
    input: UpdateChannelInput
  ) => ResultAsync<Channel, NoteError>;
  /** チャネルを削除 */
  readonly deleteChannel: (id: string) => ResultAsync<void, NoteError>;
  /** デフォルトチャネル（General）を作成または取得 */
  readonly ensureDefaultChannel: (authorId: string) => ResultAsync<Channel, NoteError>;
}
