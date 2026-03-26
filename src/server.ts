import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/db';
import { redis } from './config/redis';

const startServer = async () => {
  try {
    await prisma.$connect();
    await redis.ping();
    app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start the server');
    process.exit(1);
  }
};

startServer();

process.on('SIGNIT', async () => {
  logger.info('shutting down server....');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('shutting down the server...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
