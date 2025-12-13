/**
 * Mention Validation Functions
 *
 * メンションの循環参照検出ロジック。
 */

import { ok, err, Result } from 'neverthrow';
import { type NoteError, circularReferenceError } from '../../errors/domain-errors';

// ==========================================
// Pure Business Logic
// ==========================================

/**
 * 循環参照を検出 (DFS)
 *
 * @param graph 既存のメンショングラフ
 * @param fromNoteId メンション元ノートID
 * @param toNoteIds メンション先ノートID配列
 */
export const detectCircularReference = (
  graph: Map<string, string[]>,
  fromNoteId: string,
  toNoteIds: string[]
): Result<void, NoteError> => {
  // 一時的にグラフにメンションを追加
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
