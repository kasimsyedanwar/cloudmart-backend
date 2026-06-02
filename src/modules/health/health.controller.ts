import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import redisClient from '../../config/redis';
import { successResponse } from '../../common/utils/api-response';

export const healthCheck = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'CloudMart API is healthy',
      requestId: req.requestId,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    }),
  );
};

export const readinessCheck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const checks = {
    server: 'ok',
    database: 'unknown',
    redis: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await redisClient.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const isReady = checks.database === 'ok' && checks.redis === 'ok';

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    message: isReady ? 'CloudMart API is ready' : 'CloudMart API is not ready',
    data: {
      checks,
      timestamp: new Date().toISOString(),
    },
    requestId: req.requestId,
  });
};
