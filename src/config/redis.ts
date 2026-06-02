import { createClient } from 'redis';
import env from './env';
import logger from './logger';

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  logger.error({ error }, 'Redis Client Error');
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  await redisClient.ping();
  logger.info('Redis connected successfully');
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
  logger.info('Redis disconnected successfully');
};

export default redisClient;
