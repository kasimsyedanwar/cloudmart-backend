import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../common/errors/AppError';
import { createToken } from '../../common/utils/jwt';

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

  const accessToken = createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    '7d',
  );
  return {
    user,
    accessToken,
  };
};

const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!user) {
    throw new AppError('Invalid email or password', 400);
  }
  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );
  if (!isPasswordMatched) {
    throw new AppError('Invalid email or password', 401);
  }
  const accessToken = createToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    '7d',
  );
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
  };
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
  getMe,
};
