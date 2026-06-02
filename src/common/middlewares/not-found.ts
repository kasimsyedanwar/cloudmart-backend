import { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

export const notFoundMiddleware: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
      code: ErrorCodes.ROUTE_NOT_FOUND,
    }),
  );
};
