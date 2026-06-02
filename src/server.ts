import app from './app';
import { connectPrisma, disconnectPrisma } from './config/prisma';
import { connectRedis, disconnectRedis } from './config/redis';
import env from './config/env';
import logger from './config/logger';

let server: ReturnType<typeof app.listen> | undefined;

const startServer = async (): Promise<void> => {
  try {
    await connectPrisma();
    await connectRedis();

    server = app.listen(env.PORT, () => {
      logger.info(`CloudMart API is running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start CloudMart API');
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down CloudMart API...`);

  if (server) {
    server.close(async () => {
      await disconnectRedis();
      await disconnectPrisma();
      process.exit(0);
    });

    return;
  }

  await disconnectRedis();
  await disconnectPrisma();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection detected');

  if (server) {
    server.close(() => {
      process.exit(1);
    });

    return;
  }

  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception detected');
  process.exit(1);
});

void startServer();
