/**
 * Note Validation Functions
 *
 * 純粋なバリデーション関数とビジネスロジック。
 */

import { ok, err, Result, ResultAsync, okAsync, errAsync } from 'neverthrow';
import type { Note } from '../../../api/db';
import { MAX_NOTE_LENGTH } from '@thread-note/shared/constants';
import { extractMentions } from '../../utils/mention-parser';
import {
  type NoteError,
  contentTooLongError,
  contentEmptyError,
  parentNoteNotFoundError,
  depthLimitExceededError,
  circularReferenceError,
  invalidHiddenReplyError,
} from '../../errors/domain-errors';

// ==========================================
// Result Utilities
// ==========================================

/** Result を ResultAsync に変換 */
export const fromResult = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.isOk() ? okAsync(result.value) : errAsync(result.error);

// ==========================================
// Pure Validation Functions
// ==========================================

/**
 * コンテンツの長さを検証
 */
export const validateContentLength = (content: string): Result<string, NoteError> => {
  if (content.length === 0) {
    return err(contentEmptyError());
  }
  if (content.length > MAX_NOTE_LENGTH) {
    return err(contentTooLongError(MAX_NOTE_LENGTH, content.length));
  }
  return ok(content);
};

/**
 * メンションIDを抽出
 */
export const extractMentionIds = (content: string): string[] => extractMentions(content);

// ==========================================
// Pure Business Logic
// ==========================================

/**
 * 循環参照を検出 (DFS)
 */
export const detectCircularReference = (
  graph: Map<string, string[]>,
  fromNoteId: string,
  toNoteIds: string[]
): Result<void, NoteError> => {
  const tempGraph = new Map(graph);
  const existingMentions = tempGraph.get(fromNoteId) || [];
  tempGraph.set(fromNoteId, [...existingMentions, ...toNoteIds]);

  const visited = new Set<string>();
  const stack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = tempGraph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    stack.delete(nodeId);
    return false;
  };

  return hasCycle(fromNoteId) ? err(circularReferenceError(fromNoteId, toNoteIds)) : ok(undefined);
};

/**
 * 親ノートから深度を計算
 */
export const calculateDepthFromParent = (
  parent: Note | undefined,
  parentId?: string
): Result<number, NoteError> => {
  if (!parentId) return ok(0);
  if (!parent) return err(parentNoteNotFoundError(parentId));
  if (parent.depth >= 1) return err(depthLimitExceededError(1));
  return ok(1);
};

/**
 * isHiddenフィールドのバリデーション
 * リプライ（parentIdあり）でisHidden=trueを設定しようとした場合はエラー
 */
export const validateIsHidden = (
  isHidden: boolean | undefined,
  parentId?: string
): Result<void, NoteError> => {
  if (isHidden === true && parentId !== undefined) {
    return err(invalidHiddenReplyError());
  }
  return ok(undefined);
};
