import {
  InventoryMovement,
  InventoryMovementType,
  Prisma,
  Product,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;
type PrismaClientLike = typeof prisma | PrismaTransactionClient;

const getClient = (tx?: PrismaTransactionClient): PrismaClientLike => {
  return tx ?? prisma;
};

const inventoryMovementInclude = {
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      vendorId: true,
      stock: true,
      lowStockThreshold: true,
      status: true,
    },
  },
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.InventoryMovementInclude;

export type InventoryMovementWithRelations =
  Prisma.InventoryMovementGetPayload<{
    include: typeof inventoryMovementInclude;
  }>;

export const inventoryRepository = {
  findProductByIdForVendor: async ({
    productId,
    vendorId,
    tx,
  }: {
    productId: string;
    vendorId: string;
    tx?: PrismaTransactionClient;
  }): Promise<Product | null> => {
    const client = getClient(tx);

    return client.product.findFirst({
      where: {
        id: productId,
        vendorId,
      },
    });
  },

  updateProductStock: async ({
    productId,
    stock,
    status,
    tx,
  }: {
    productId: string;
    stock: number;
    status: ProductStatus;
    tx?: PrismaTransactionClient;
  }): Promise<Product> => {
    const client = getClient(tx);

    return client.product.update({
      where: {
        id: productId,
      },
      data: {
        stock,
        status,
      },
    });
  },

  createInventoryMovement: async ({
    productId,
    actorId,
    type,
    quantity,
    reason,
    stockBefore,
    stockAfter,
    tx,
  }: {
    productId: string;
    actorId: string;
    type: InventoryMovementType;
    quantity: number;
    reason: string;
    stockBefore: number;
    stockAfter: number;
    tx?: PrismaTransactionClient;
  }): Promise<InventoryMovement> => {
    const client = getClient(tx);

    return client.inventoryMovement.create({
      data: {
        productId,
        actorId,
        type,
        quantity,
        reason,
        stockBefore,
        stockAfter,
      },
    });
  },

  listInventoryMovements: async ({
    where,
    skip,
    take,
  }: {
    where: Prisma.InventoryMovementWhereInput;
    skip: number;
    take: number;
  }): Promise<InventoryMovementWithRelations[]> => {
    return prisma.inventoryMovement.findMany({
      where,
      include: inventoryMovementInclude,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  },

  countInventoryMovements: async (
    where: Prisma.InventoryMovementWhereInput,
  ): Promise<number> => {
    return prisma.inventoryMovement.count({
      where,
    });
  },

  listVendorLowStockProducts: async (vendorId: string): Promise<Product[]> => {
    return prisma.product.findMany({
      where: {
        vendorId,
        status: {
          not: ProductStatus.ARCHIVED,
        },
      },
      orderBy: [
        {
          stock: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  },
};
