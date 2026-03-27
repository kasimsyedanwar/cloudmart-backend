import { NextFunction, Response, Request } from 'express';
import { env } from '../config/env';
import { AppError } from '../common/errors/AppError';
import { verifyToken } from '../common/utils/jwt';

type TJwtPayload = {
  userId: string;
  email: string;
  role: string;
  iat: string;
  exp: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: TJwtPayload;
    }
  }
}

export const auth = (...requiredRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new AppError('You are not authorized', 401);
    }
    const token = authorization.split(' ')[1];
    if (!token) {
      throw new AppError('Invalid authorization header format', 401);
    }
    const decoded = verifyToken<TJwtPayload>(token, env.JWT_ACCESS_SECRET);
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      throw new AppError('You are forbidden from accessing this resource', 403);
    }
    req.user = decoded;
    next();
  };
};
