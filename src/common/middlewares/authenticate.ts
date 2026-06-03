import { RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError({
        message: 'Access token is required',
        statusCode: 401,
        code: ErrorCodes.UNAUTHORIZED,
      });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError({
        message: 'Access token is required',
        statusCode: 401,
        code: ErrorCodes.UNAUTHORIZED,
      });
    }
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
    if (!user) {
      throw new AppError({
        message: 'Authenticated user no longer exists',
        statusCode: 401,
        code: ErrorCodes.INVALID_TOKEN,
      });
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError({
        message: 'User account is not active',
        statusCode: 401,
        code: ErrorCodes.ACCOUNT_INACTIVE,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(
        new AppError({
          message: 'Access token is expired',
          statusCode: 401,
          code: ErrorCodes.TOKEN_EXPIRED,
        }),
      );
      return;
    }
    if (error instanceof JsonWebTokenError) {
      next(
        new AppError({
          message: 'Invalid access token',
          statusCode: 401,
          code: ErrorCodes.INVALID_TOKEN,
        }),
      );
      return;
    }
    next(error);
  }
};
