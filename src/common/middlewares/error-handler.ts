import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import env from '../../config/env';
import logger from '../../config/logger';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import { ApiErrorResponse } from '../utils/api-response';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string = ErrorCodes.INTERNAL_SERVER_ERROR;
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = ErrorCodes.VALIDATION_ERROR;
    details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }

  logger.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
    },
    message,
  );

  const response: ApiErrorResponse = {
    success: false,
    message,
    code,
    requestId: req.requestId,
    details: env.NODE_ENV === 'development' ? details : undefined,
  };

  res.status(statusCode).json(response);
};
