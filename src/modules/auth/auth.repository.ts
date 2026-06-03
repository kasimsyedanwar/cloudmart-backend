import {
  Prisma,
  RefreshToken,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;

type CreateCustomerInput = {
  name: string;
  email: string;
  passwordHash: string;
};

type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

const getClient = (tx?: PrismaTransactionClient): PrismaClientLike => {
  return tx ?? prisma;
};

type PrismaClientLike = typeof prisma | PrismaTransactionClient;

export const authRepository = {
  findUserByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  findUserById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  },

  createCustomer: async ({
    name,
    email,
    passwordHash,
  }: CreateCustomerInput): Promise<User> => {
    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
  },

  createRefreshToken: async (
    input: CreateRefreshTokenInput,
    tx?: PrismaTransactionClient,
  ): Promise<RefreshToken> => {
    const client = getClient(tx);

    return client.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
  },

  findRefreshTokenByHash: async (
    tokenHash: string,
  ): Promise<(RefreshToken & { user: User }) | null> => {
    return prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });
  },

  revokeRefreshToken: async (
    tokenHash: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> => {
    const client = getClient(tx);

    await client.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  revokeAllUserRefreshTokens: async (userId: string): Promise<void> => {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
