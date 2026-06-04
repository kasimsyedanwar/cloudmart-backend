import { NextFunction, Request, Response } from 'express';
import { cacheService } from '../../common/cache/cache.service';

type CachePattern = string | ((req: Request) => string);

type InvalidateCacheOptions = {
  patterns: CachePattern[];
};

export const invalidateCache = ({ patterns }: InvalidateCacheOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resolvedPatterns = patterns.map((pattern) => {
          if (typeof pattern === 'function') {
            return pattern(req);
          }

          return pattern;
        });

        void Promise.all(
          resolvedPatterns.map((pattern) =>
            cacheService.deleteByPattern(pattern),
          ),
        );
      }

      return originalJson(body);
    }) as Response['json'];

    next();
  };
};
