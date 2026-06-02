import { Request, Response } from 'express';
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

export const readinessCheck = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'CloudMart API is ready',
      requestId: req.requestId,
      data: {
        checks: {
          server: 'ok',
        },
        timestamp: new Date().toISOString(),
      },
    }),
  );
};
