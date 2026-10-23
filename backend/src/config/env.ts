import 'dotenv/config';
import { z } from 'zod';

/**
 * Every environment variable the API depends on is declared and validated here,
 * so a misconfigured deployment fails fast at boot instead of at request time.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * Unpooled connection used by Prisma Migrate. Required by managed providers
   * such as Neon, whose default endpoint is a PgBouncer pool that cannot proxy
   * the DDL a migration issues. Optional: a plain PostgreSQL needs only one URL.
   */
  DIRECT_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SEED_DEFAULT_PASSWORD: z.string().min(8).default('Password@123'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  /** CORS_ORIGIN accepts a comma separated list; "*" allows any origin. */
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type Env = typeof env;
