import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../../common/utils/jwt';

type TJwtPayload = {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

const buildTokenPayload = (user: {
  id: string;
  email: string;
  role: UserRole;
}) => ({
  userId: user.id,
  email: user.email,
  role: user.role,
});

const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new AppError('Email already exists', 400);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: UserRole.CUSTOMER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const tokenPayload = buildTokenPayload({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const accessToken = createAccessToken(tokenPayload, env.JWT_ACCESS_SECRET);
  const refreshToken = createRefreshToken(tokenPayload, env.JWT_REFRESH_SECRET);

  const decodedRefreshToken = verifyToken<TJwtPayload>(
    refreshToken,
    env.JWT_REFRESH_SECRET,
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordMatched) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokenPayload = buildTokenPayload({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  const accessToken = createAccessToken(tokenPayload, env.JWT_ACCESS_SECRET);
  const refreshToken = createRefreshToken(tokenPayload, env.JWT_REFRESH_SECRET);

  const decodedRefreshToken = verifyToken<TJwtPayload>(
    refreshToken,
    env.JWT_REFRESH_SECRET,
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token,
    },
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.isRevoked) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token has expired', 401);
  }

  const decoded = verifyToken<TJwtPayload>(token, env.JWT_REFRESH_SECRET);

  const accessToken = createAccessToken(
    {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    },
    env.JWT_ACCESS_SECRET,
  );

  return {
    accessToken,
  };
};

const logoutUser = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token,
    },
  });

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  await prisma.refreshToken.update({
    where: {
      token,
    },
    data: {
      isRevoked: true,
    },
  });

  return null;
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
};
