import { ErrorCode, ErrorCodes } from './error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor({
    message,
    statusCode = 500,
    code = ErrorCodes.INTERNAL_SERVER_ERROR,
    isOperational = true,
    details,
  }: {
    message: string;
    statusCode?: number;
    code?: ErrorCode;
    isOperational?: boolean;
    details?: unknown;
  }) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
