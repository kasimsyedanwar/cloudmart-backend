import logger from '../../config/logger';
import { isRedisReady, redisClient } from '../../config/redis';

type CacheSetOptions = {
  ttlSeconds: number;
};

export const cacheService = {
  get: async <T>(key: string): Promise<T | null> => {
    if (!isRedisReady()) {
      return null;
    }

    try {
      const cachedValue = await redisClient.get(key);

      if (!cachedValue) {
        return null;
      }

      return JSON.parse(cachedValue) as T;
    } catch (error) {
      logger.error(
        {
          err: error,
          key,
        },
        'Redis cache get failed',
      );

      return null;
    }
  },

  set: async <T>(
    key: string,
    value: T,
    options: CacheSetOptions,
  ): Promise<void> => {
    if (!isRedisReady()) {
      return;
    }

    try {
      await redisClient.setEx(key, options.ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error(
        {
          err: error,
          key,
        },
        'Redis cache set failed',
      );
    }
  },

  deleteByPattern: async (pattern: string): Promise<number> => {
    if (!isRedisReady()) {
      return 0;
    }

    try {
      const keys: string[] = [];

      for await (const key of redisClient.scanIterator({
        MATCH: pattern,
        COUNT: 100,
      })) {
        keys.push(String(key));
      }

      if (keys.length === 0) {
        return 0;
      }

      let deletedCount = 0;

      for (const key of keys) {
        deletedCount += await redisClient.del(key);
      }

      return deletedCount;
    } catch (error) {
      logger.error(
        {
          err: error,
          pattern,
        },
        'Redis cache pattern delete failed',
      );

      return 0;
    }
  },
};
