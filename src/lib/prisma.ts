import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

declare global {
  var __jibuPrisma__: PrismaClient | undefined;
}

const createClient = () => {
  const adapter = env.databaseUrl
    ? new PrismaPg({
        connectionString: env.databaseUrl,
      })
    : undefined;

  return new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });
};

export const prisma = globalThis.__jibuPrisma__ ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__jibuPrisma__ = prisma;
}
