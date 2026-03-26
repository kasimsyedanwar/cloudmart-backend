import { Response } from 'express';
type TMeta = Record<string, unknown>;

interface TResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: TMeta;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  payload: TResponse<T>,
) => {
  res.status(statusCode).json(payload);
};
