import { UserRole } from '@prisma/client';
import { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, _res, next): void => {
    if (!req.user) {
      next(
        new AppError({
          message: 'Authentication is required',
          statusCode: 401,
          code: ErrorCodes.UNAUTHORIZED,
        }),
      );

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError({
          message: 'You do not have permission to access this resource',
          statusCode: 403,
          code: ErrorCodes.FORBIDDEN,
        }),
      );

      return;
    }

    next();
  };
};
