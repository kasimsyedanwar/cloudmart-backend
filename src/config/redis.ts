import { createClient } from 'redis';
import env from './env';
import logger from './logger';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  logger.error(
    {
      err: error,
    },
    'Redis client error',
  );
});

redisClient.on('connect', () => {
  logger.info('Redis client connecting');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('end', () => {
  logger.info('Redis client disconnected');
});

export const isRedisReady = (): boolean => {
  return redisClient.isReady;
};

export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();

  const pong = await redisClient.ping();

  logger.info(
    {
      pong,
    },
    'Redis connected successfully',
  );
};

export const disconnectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.quit();

  logger.info('Redis disconnected successfully');
};

export const pingRedis = async (): Promise<boolean> => {
  if (!redisClient.isReady) {
    return false;
  }

  const pong = await redisClient.ping();

  return pong === 'PONG';
};

export const connectToRedis = connectRedis;
export const disconnectFromRedis = disconnectRedis;
export const checkRedisHealth = pingRedis;

export default redisClient;
