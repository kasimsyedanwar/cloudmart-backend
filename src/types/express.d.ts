import { UserRole, UserStatus } from '@prisma/client';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    };
  }
}
