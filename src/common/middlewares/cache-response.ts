import { NextFunction, Request, Response } from 'express';

import { cacheService } from '../cache/cache.service';

type CachedHttpResponse = {
  statusCode: number;
  body: unknown;
};

type CacheResponseOptions = {
  ttlSeconds: number;
  keyBuilder: (req: Request) => string;
};

const addFreshRequestId = ({
  body,
  requestId,
}: {
  body: unknown;
  requestId: string;
}): unknown => {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return {
      ...(body as Record<string, unknown>),
      requestId,
    };
  }

  return body;
};

export const cacheResponse = ({
  ttlSeconds,
  keyBuilder,
}: CacheResponseOptions) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = keyBuilder(req);
    const requestId = req.requestId ?? 'unknown-request-id';

    const cachedResponse = await cacheService.get<CachedHttpResponse>(cacheKey);

    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);

      res.status(cachedResponse.statusCode).json(
        addFreshRequestId({
          body: cachedResponse.body,
          requestId,
        }),
      );

      return;
    }

    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseToCache: CachedHttpResponse = {
          statusCode: res.statusCode,
          body,
        };

        void cacheService.set(cacheKey, responseToCache, {
          ttlSeconds,
        });
      }

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      return originalJson(body);
    }) as Response['json'];

    next();
  };
};
