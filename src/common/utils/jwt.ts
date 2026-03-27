import jwt, { Secret, SignOptions } from 'jsonwebtoken';

export const createToken = (
  payload: object,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = <T>(token: string, secret: Secret) => {
  return jwt.verify(token, secret) as T;
};

export const createAccessToken = (payload: object, secret: Secret) => {
  return createToken(payload, secret, '15m');
};

export const createRefreshToken = (payload: object, secret: Secret) => {
  return createToken(payload, secret, '7d');
};
