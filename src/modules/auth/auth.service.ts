import { User, UserStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { comparePassword, hashPassword } from '../../common/utils/password';
import { signAccessToken } from '../../common/utils/jwt';
import { LoginInput, RegisterInput } from './auth.validation';
import { authRepository } from './auth.repository';

type SafeAuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
};

type AuthResult = {
  user: SafeAuthUser;
  accessToken: string;
  tokenType: 'Bearer';
};

const toSafeAuthUser = (user: User): SafeAuthUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
};

const buildAuthResult = (user: User): AuthResult => {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: toSafeAuthUser(user),
    accessToken,
    tokenType: 'Bearer',
  };
};

export const authService = {
  registerCustomer: async (input: RegisterInput): Promise<AuthResult> => {
    const existingUser = await authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError({
        message: 'Email is already registered',
        statusCode: 409,
        code: ErrorCodes.CONFLICT,
      });
    }

    const passwordHash = await hashPassword(input.password);

    const user = await authRepository.createCustomer({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return buildAuthResult(user);
  },

  login: async (input: LoginInput): Promise<AuthResult> => {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError({
        message: 'Invalid email or password',
        statusCode: 401,
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError({
        message: 'User account is not active',
        statusCode: 403,
        code: ErrorCodes.ACCOUNT_INACTIVE,
      });
    }

    const isPasswordValid = await comparePassword({
      plainPassword: input.password,
      passwordHash: user.passwordHash,
    });

    if (!isPasswordValid) {
      throw new AppError({
        message: 'Invalid email or password',
        statusCode: 401,
        code: ErrorCodes.INVALID_CREDENTIALS,
      });
    }

    return buildAuthResult(user);
  },
};
