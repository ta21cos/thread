import {
  createMentionRepository,
  type MentionRepository,
} from '../repositories/mention.repository';
import type { Mention, Database } from '../db';

// NOTE: Service for mention tracking with circular reference detection (DFS)
export class MentionService {
  private mentionRepo: MentionRepository;

  constructor({ db }: { db: Database }) {
    this.mentionRepo = createMentionRepository({ db });
  }

  async getMentions(toNoteId: string): Promise<Mention[]> {
    const result = await this.mentionRepo.findByToNoteId(toNoteId);
    if (result.isErr()) {
      throw new Error(result.error.message);
    }
    return result.value;
  }

  async getMentionsWithNotes(toNoteId: string) {
    const result = await this.mentionRepo.getMentionsWithNotes(toNoteId);
    if (result.isErr()) {
      throw new Error(result.error.message);
    }
    return result.value;
  }

  // NOTE: DFS cycle detection (from clarifications: prevent circular references)
  async validateMentions(fromNoteId: string, toNoteIds: string[]): Promise<void> {
    const graphResult = await this.mentionRepo.getAllMentions();
    if (graphResult.isErr()) {
      throw new Error(graphResult.error.message);
    }
    const graph = graphResult.value;

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
