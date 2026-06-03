import { Address, Prisma, User, UserStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { CreateAddressInput, UpdateAddressInput } from './user.validation';

type PrismaTransactionClient = Prisma.TransactionClient;
type PrismaClientLike = typeof prisma | PrismaTransactionClient;

const getClient = (tx?: PrismaTransactionClient): PrismaClientLike => {
  return tx ?? prisma;
};

export const userRepository = {
  findUserById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  },

  updateUserProfile: async ({
    id,
    name,
  }: {
    id: string;
    name?: string;
  }): Promise<User> => {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });
  },

  listUsers: async ({
    where,
    skip,
    take,
  }: {
    where: Prisma.UserWhereInput;
    skip: number;
    take: number;
  }): Promise<User[]> => {
    return prisma.user.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  },

  countUsers: async (where: Prisma.UserWhereInput): Promise<number> => {
    return prisma.user.count({
      where,
    });
  },

  updateUserStatus: async ({
    id,
    status,
  }: {
    id: string;
    status: UserStatus;
  }): Promise<User> => {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  },

  listAddressesByUserId: async (userId: string): Promise<Address[]> => {
    return prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  },

  countAddressesByUserId: async (userId: string): Promise<number> => {
    return prisma.address.count({
      where: {
        userId,
      },
    });
  },

  findAddressById: async (id: string): Promise<Address | null> => {
    return prisma.address.findUnique({
      where: {
        id,
      },
    });
  },

  unsetDefaultAddresses: async (
    userId: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> => {
    const client = getClient(tx);

    await client.address.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  },

  createAddress: async ({
    userId,
    input,
    tx,
  }: {
    userId: string;
    input: CreateAddressInput;
    tx?: PrismaTransactionClient;
  }): Promise<Address> => {
    const client = getClient(tx);

    return client.address.create({
      data: {
        userId,
        type: input.type,
        fullName: input.fullName,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        country: input.country,
        isDefault: input.isDefault,
      },
    });
  },

  updateAddress: async ({
    id,
    input,
    tx,
  }: {
    id: string;
    input: UpdateAddressInput;
    tx?: PrismaTransactionClient;
  }): Promise<Address> => {
    const client = getClient(tx);

    return client.address.update({
      where: {
        id,
      },
      data: input,
    });
  },

  deleteAddress: async ({
    id,
    tx,
  }: {
    id: string;
    tx?: PrismaTransactionClient;
  }): Promise<Address> => {
    const client = getClient(tx);

    return client.address.delete({
      where: {
        id,
      },
    });
  },

  findLatestAddressByUserId: async ({
    userId,
    tx,
  }: {
    userId: string;
    tx?: PrismaTransactionClient;
  }): Promise<Address | null> => {
    const client = getClient(tx);

    return client.address.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};
