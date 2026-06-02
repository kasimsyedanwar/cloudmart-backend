import { Request, Response } from 'express';

export const healthCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'CloudMart api is healthy',
    timestamp: new Date().toISOString(),
  });
};

export const readinessCheck = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'CloudMart Api is ready',
    checks: {
      server: 'ok',
    },
    timestamp: new Date().toISOString(),
  });
};
