import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = req.header('x-request-id') || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};
