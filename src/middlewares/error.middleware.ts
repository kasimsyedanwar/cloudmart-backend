import { NextFunction, Response, Request } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/AppError';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server error';
  let errors: Array<{ field?: string; message: string }> = [];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'validation failed';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Error) {
    message = err.message;
  }
  logger.error(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      err,
    },
    'Request Failed',
  );
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length ? errors : undefined,
    stack:
      env.NODE_ENV === 'development' && err instanceof Error
        ? err.stack
        : undefined,
  });
};
