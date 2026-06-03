import { User, UserRole, UserStatus } from '@prisma/client';

import prisma from '../../config/prisma';

type CreateCustomerInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export const authRepository = {
  findUserByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: {
        email,
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
};
