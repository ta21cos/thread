import { PrismaClient } from '../generated/prisma';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton Prisma Client instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Store the Prisma Client instance in global scope in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
