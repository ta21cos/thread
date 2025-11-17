import { MentionRepository } from '../repositories/mention.repository';
import type { Mention } from '../db';

// NOTE: Service for mention tracking with circular reference detection (DFS)
export class MentionService {
  private mentionRepo = new MentionRepository();

  async getMentions(toNoteId: string): Promise<Mention[]> {
    return this.mentionRepo.findByToNoteId(toNoteId);
  }

  async getMentionsWithNotes(toNoteId: string) {
    return this.mentionRepo.getMentionsWithNotes(toNoteId);
  }

  // NOTE: DFS cycle detection (from clarifications: prevent circular references)
  async validateMentions(fromNoteId: string, toNoteIds: string[]): Promise<void> {
    const graph = await this.mentionRepo.getAllMentions();

    // Add proposed mentions temporarily
    if (!graph.has(fromNoteId)) {
      graph.set(fromNoteId, []);
    }
    const existingMentions = graph.get(fromNoteId) || [];
    graph.set(fromNoteId, [...existingMentions, ...toNoteIds]);

    // DFS to detect cycles
    const visited = new Set<string>();
    const stack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (stack.has(nodeId)) {
        return true; // Cycle detected
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      stack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      stack.delete(nodeId);
      return false;
    };

    if (hasCycle(fromNoteId)) {
      throw new Error('Circular reference detected in mentions');
    }
  }
}

export const mentionService = new MentionService();
