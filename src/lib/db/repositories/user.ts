import { User } from '@/generated/prisma';
import { prisma } from '../../prisma';

/**
 * Repository for User entity
 * Implements CRUD operations and other business logic for users
 */
export const UserRepository = {
  /**
   * Create a new user
   */
  create: async ({ id, email }: { id: string; email: string }): Promise<User> => {
    return prisma.user.create({
      data: {
        id,
        email,
      },
    });
  },

  /**
   * Find a user by ID
   */
  findById: async (userId: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  },

  /**
   * Find a user by email
   */
  findByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  /**
   * Get all users
   */
  findAll: async (): Promise<User[]> => {
    return prisma.user.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  /**
   * Update a user
   */
  update: async ({ id, email }: { id: string; email: string }): Promise<User> => {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        email,
      },
    });
  },

  /**
   * Delete a user and all associated memos
   */
  delete: async (userId: string): Promise<void> => {
    // Delete user and associated memos in a transaction
    await prisma.$transaction([
      prisma.memo.deleteMany({ where: { user_id: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
  },
};
