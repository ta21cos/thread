import { Memo } from '@/lib/prisma/types';
import { prisma } from '../../prisma';
/**
 * Repository for Memo entity
 * Implements CRUD operations and other business logic for memos
 */
export const MemoRepository = {
  /**
   * Create a new memo
   */
  create: async ({
    content,
    user_id,
    parent_id,
  }: {
    content: string;
    user_id: string;
    parent_id: string | null;
  }): Promise<Memo> =>
    prisma.memo.create({
      data: {
        content,
        user_id,
        parent_id,
      },
    }),

  /**
   * Get all root memos (not replies)
   */
  findAll: async (): Promise<Memo[]> =>
    prisma.memo.findMany({
      where: {
        parent_id: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    }),

  /**
   * Get replies to a specific memo
   */
  findReplies: async (memoId: string): Promise<Memo[]> =>
    prisma.memo.findMany({
      where: {
        parent_id: memoId,
      },
      orderBy: {
        created_at: 'asc',
      },
    }),

  /**
   * Delete a memo and all its replies
   */
  delete: async (memoId: string): Promise<void> => {
    // Delete replies and the memo in a transaction
    await prisma.$transaction([
      prisma.memo.deleteMany({ where: { parent_id: memoId } }),
      prisma.memo.delete({ where: { id: memoId } }),
    ]);
  },
};
