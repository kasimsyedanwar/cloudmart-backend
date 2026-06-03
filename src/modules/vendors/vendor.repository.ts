import { Prisma, UserRole, VendorProfile, VendorStatus } from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;
type PrismaClientLike = typeof prisma | PrismaTransactionClient;

type CreateVendorProfileInput = {
  userId: string;
  storeName: string;
  slug: string;
  description?: string;
};

type UpdateVendorProfileInput = {
  storeName?: string;
  slug?: string;
  description?: string;
};

const getClient = (tx?: PrismaTransactionClient): PrismaClientLike => {
  return tx ?? prisma;
};

export const vendorRepository = {
  findVendorProfileByUserId: async (
    userId: string,
  ): Promise<VendorProfile | null> => {
    return prisma.vendorProfile.findUnique({
      where: {
        userId,
      },
    });
  },

  findVendorProfileById: async (
    id: string,
  ): Promise<
    | (VendorProfile & {
        user: { id: string; name: string; email: string; role: UserRole };
      })
    | null
  > => {
    return prisma.vendorProfile.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  findVendorProfileBySlug: async (
    slug: string,
  ): Promise<VendorProfile | null> => {
    return prisma.vendorProfile.findUnique({
      where: {
        slug,
      },
    });
  },

  createVendorProfile: async (
    input: CreateVendorProfileInput,
    tx?: PrismaTransactionClient,
  ): Promise<VendorProfile> => {
    const client = getClient(tx);

    return client.vendorProfile.create({
      data: {
        userId: input.userId,
        storeName: input.storeName,
        slug: input.slug,
        description: input.description,
        status: VendorStatus.PENDING,
      },
    });
  },

  updateUserRoleToVendor: async (
    userId: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> => {
    const client = getClient(tx);

    await client.user.update({
      where: {
        id: userId,
      },
      data: {
        role: UserRole.VENDOR,
      },
    });
  },

  updateVendorProfile: async ({
    id,
    data,
  }: {
    id: string;
    data: UpdateVendorProfileInput;
  }): Promise<VendorProfile> => {
    return prisma.vendorProfile.update({
      where: {
        id,
      },
      data,
    });
  },

  updateVendorStatus: async ({
    id,
    status,
  }: {
    id: string;
    status: VendorStatus;
  }): Promise<VendorProfile> => {
    const now = new Date();

    return prisma.vendorProfile.update({
      where: {
        id,
      },
      data: {
        status,
        approvedAt: status === VendorStatus.APPROVED ? now : null,
        rejectedAt: status === VendorStatus.REJECTED ? now : null,
      },
    });
  },

  listVendors: async ({
    status,
    skip,
    take,
  }: {
    status?: VendorStatus;
    skip: number;
    take: number;
  }) => {
    return prisma.vendorProfile.findMany({
      where: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  },

  countVendors: async (status?: VendorStatus): Promise<number> => {
    return prisma.vendorProfile.count({
      where: {
        status,
      },
    });
  },
};
