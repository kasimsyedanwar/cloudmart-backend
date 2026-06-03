import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

import env from '../../config/env';

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};
