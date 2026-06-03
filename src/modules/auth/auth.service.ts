import { User, UserStatus } from '@prisma/client';

import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
  signAccessToken,
} from '../../common/utils/jwt';
import { comparePassword, hashPassword } from '../../common/utils/password';
import {
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from './auth.validation';
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
  refreshToken: string;
  tokenType: 'Bearer';
};

type MeResult = {
  user: SafeAuthUser;
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

const createTokenPair = async (
  user: User,
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    accessToken,
    refreshToken,
  };
};

const buildAuthResult = async (user: User): Promise<AuthResult> => {
  const tokens = await createTokenPair(user);

  return {
    user: toSafeAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: 'Bearer',
  };
};

const assertActiveUser = (user: User): void => {
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError({
      message: 'User account is not active',
      statusCode: 403,
      code: ErrorCodes.ACCOUNT_INACTIVE,
    });
  }
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

    assertActiveUser(user);

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

  refreshToken: async (input: RefreshTokenInput): Promise<AuthResult> => {
    const incomingTokenHash = hashRefreshToken(input.refreshToken);

    const storedRefreshToken =
      await authRepository.findRefreshTokenByHash(incomingTokenHash);

    if (!storedRefreshToken) {
      throw new AppError({
        message: 'Invalid refresh token',
        statusCode: 401,
        code: ErrorCodes.INVALID_TOKEN,
      });
    }

    if (storedRefreshToken.revokedAt) {
      throw new AppError({
        message: 'Refresh token has been revoked',
        statusCode: 401,
        code: ErrorCodes.INVALID_TOKEN,
      });
    }

    if (storedRefreshToken.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        message: 'Refresh token expired',
        statusCode: 401,
        code: ErrorCodes.TOKEN_EXPIRED,
      });
    }

    assertActiveUser(storedRefreshToken.user);

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

    await prisma.$transaction(async (tx) => {
      await authRepository.revokeRefreshToken(incomingTokenHash, tx);

      await authRepository.createRefreshToken(
        {
          userId: storedRefreshToken.userId,
          tokenHash: newRefreshTokenHash,
          expiresAt: getRefreshTokenExpiry(),
        },
        tx,
      );
    });

    const accessToken = signAccessToken({
      userId: storedRefreshToken.user.id,
      email: storedRefreshToken.user.email,
      role: storedRefreshToken.user.role,
    });

    return {
      user: toSafeAuthUser(storedRefreshToken.user),
      accessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
    };
  },

  logout: async (input: LogoutInput): Promise<void> => {
    const tokenHash = hashRefreshToken(input.refreshToken);

    await authRepository.revokeRefreshToken(tokenHash);
  },

  getMe: async (userId: string): Promise<MeResult> => {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError({
        message: 'Authenticated user no longer exists',
        statusCode: 401,
        code: ErrorCodes.INVALID_TOKEN,
      });
    }

    assertActiveUser(user);

    return {
      user: toSafeAuthUser(user),
    };
  },
};
