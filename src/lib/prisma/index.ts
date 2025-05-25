import { PrismaClient } from '@/generated/prisma';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton Prisma Client instance
// ref: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help#avoid-multiple-prisma-client-instances
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

console.log({ prisma });

// Store the Prisma Client instance in global scope in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
