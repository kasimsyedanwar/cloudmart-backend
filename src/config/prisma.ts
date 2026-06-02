import { PrismaClient } from '@prisma/client';
import env from './env';
import logger from './logger';

const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const connectPrisma = async (): Promise<void> => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  logger.info('PostgreSQL connected successfully');
};

export const disconnectPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected successfully');
};

export default prisma;
