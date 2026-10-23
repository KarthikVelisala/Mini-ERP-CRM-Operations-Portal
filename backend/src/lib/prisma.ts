import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * A single PrismaClient instance is shared across the process. In development
 * the instance is cached on `globalThis` so `tsx watch` reloads do not open a
 * new connection pool on every file change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

/**
 * Budget for interactive transactions.
 *
 * Prisma defaults to a 5 second limit, which a hosted database several hundred
 * milliseconds away (Neon, for instance) can exceed on a multi-line challan.
 * These figures leave ample room without letting a genuinely stuck transaction
 * hold its locks indefinitely.
 */
export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

export type { Prisma } from '@prisma/client';
