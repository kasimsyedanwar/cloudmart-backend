import {
  InventoryMovement,
  InventoryMovementType,
  Prisma,
  Product,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  buildPaginationMeta,
  getPagination,
} from '../../common/utils/pagination';
import {
  AdjustStockInput,
  ListInventoryMovementsQuery,
} from './inventory.validation';
import {
  inventoryRepository,
  InventoryMovementWithRelations,
} from './inventory.repository';

type InventoryMovementResponse = {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  stockBefore: number;
  stockAfter: number;
  actorId: string | null;
  product?: {
    id: string;
    title: string;
    slug: string;
    vendorId: string;
    stock: number;
    lowStockThreshold: number;
    status: ProductStatus;
  };
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: Date;
};

type LowStockProductResponse = {
  id: string;
  title: string;
  slug: string;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  needsRestock: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type StockAdjustmentResponse = {
  product: {
    id: string;
    title: string;
    stock: number;
    status: ProductStatus;
  };
  movement: InventoryMovementResponse;
};

const toInventoryMovementResponse = (
  movement: InventoryMovement | InventoryMovementWithRelations,
): InventoryMovementResponse => {
  const movementWithRelations = movement as InventoryMovementWithRelations;

  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    actorId: movement.actorId,
    product: movementWithRelations.product
      ? {
          id: movementWithRelations.product.id,
          title: movementWithRelations.product.title,
          slug: movementWithRelations.product.slug,
          vendorId: movementWithRelations.product.vendorId,
          stock: movementWithRelations.product.stock,
          lowStockThreshold: movementWithRelations.product.lowStockThreshold,
          status: movementWithRelations.product.status,
        }
      : undefined,
    actor: movementWithRelations.actor
      ? {
          id: movementWithRelations.actor.id,
          name: movementWithRelations.actor.name,
          email: movementWithRelations.actor.email,
          role: movementWithRelations.actor.role,
        }
      : undefined,
    createdAt: movement.createdAt,
  };
};

const toLowStockProductResponse = (
  product: Product,
): LowStockProductResponse => {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    needsRestock: product.stock <= product.lowStockThreshold,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const getNextProductStatus = ({
  currentStatus,
  stockAfter,
}: {
  currentStatus: ProductStatus;
  stockAfter: number;
}): ProductStatus => {
  if (currentStatus === ProductStatus.ARCHIVED) {
    return ProductStatus.ARCHIVED;
  }

  if (currentStatus === ProductStatus.DRAFT) {
    return ProductStatus.DRAFT;
  }

  if (stockAfter <= 0) {
    return ProductStatus.OUT_OF_STOCK;
  }

  if (currentStatus === ProductStatus.OUT_OF_STOCK && stockAfter > 0) {
    return ProductStatus.ACTIVE;
  }

  return currentStatus;
};

const calculateStockAdjustment = ({
  input,
  stockBefore,
}: {
  input: AdjustStockInput;
  stockBefore: number;
}): {
  stockAfter: number;
  movementType: InventoryMovementType;
  movementQuantity: number;
} => {
  if (input.adjustmentType === 'INCREASE') {
    const quantity = input.quantity ?? 0;

    return {
      stockAfter: stockBefore + quantity,
      movementType: InventoryMovementType.STOCK_IN,
      movementQuantity: quantity,
    };
  }

  if (input.adjustmentType === 'DECREASE') {
    const quantity = input.quantity ?? 0;

    if (stockBefore < quantity) {
      throw new AppError({
        message: 'Insufficient stock for this adjustment',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    return {
      stockAfter: stockBefore - quantity,
      movementType: InventoryMovementType.STOCK_OUT,
      movementQuantity: quantity,
    };
  }

  const newStock = input.newStock ?? stockBefore;
  const movementQuantity = Math.abs(newStock - stockBefore);

  if (movementQuantity === 0) {
    throw new AppError({
      message: 'New stock is same as current stock',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  return {
    stockAfter: newStock,
    movementType: InventoryMovementType.MANUAL_ADJUSTMENT,
    movementQuantity,
  };
};

export const inventoryService = {
  adjustVendorProductStock: async ({
    vendorId,
    actorId,
    input,
  }: {
    vendorId: string;
    actorId: string;
    input: AdjustStockInput;
  }): Promise<StockAdjustmentResponse> => {
    const result = await prisma.$transaction(
      async (tx) => {
        const product = await inventoryRepository.findProductByIdForVendor({
          productId: input.productId,
          vendorId,
          tx,
        });

        if (!product) {
          throw new AppError({
            message: 'Product not found',
            statusCode: 404,
            code: ErrorCodes.NOT_FOUND,
          });
        }

        if (product.status === ProductStatus.ARCHIVED) {
          throw new AppError({
            message: 'Archived product stock cannot be adjusted',
            statusCode: 400,
            code: ErrorCodes.BAD_REQUEST,
          });
        }

        const stockBefore = product.stock;

        const { stockAfter, movementType, movementQuantity } =
          calculateStockAdjustment({
            input,
            stockBefore,
          });

        const nextStatus = getNextProductStatus({
          currentStatus: product.status,
          stockAfter,
        });

        const updatedProduct = await inventoryRepository.updateProductStock({
          productId: product.id,
          stock: stockAfter,
          status: nextStatus,
          tx,
        });

        const movement = await inventoryRepository.createInventoryMovement({
          productId: product.id,
          actorId,
          type: movementType,
          quantity: movementQuantity,
          reason: input.reason,
          stockBefore,
          stockAfter,
          tx,
        });

        return {
          product: updatedProduct,
          movement,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return {
      product: {
        id: result.product.id,
        title: result.product.title,
        stock: result.product.stock,
        status: result.product.status,
      },
      movement: toInventoryMovementResponse(result.movement),
    };
  },

  listVendorInventoryMovements: async ({
    vendorId,
    query,
  }: {
    vendorId: string;
    query: ListInventoryMovementsQuery;
  }) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.InventoryMovementWhereInput = {
      productId: query.productId,
      type: query.type,
      product: {
        vendorId,
      },
    };

    const [movements, total] = await Promise.all([
      inventoryRepository.listInventoryMovements({
        where,
        skip,
        take,
      }),
      inventoryRepository.countInventoryMovements(where),
    ]);

    return {
      movements: movements.map(toInventoryMovementResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  listAdminInventoryMovements: async (query: ListInventoryMovementsQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.InventoryMovementWhereInput = {
      productId: query.productId,
      type: query.type,
    };

    const [movements, total] = await Promise.all([
      inventoryRepository.listInventoryMovements({
        where,
        skip,
        take,
      }),
      inventoryRepository.countInventoryMovements(where),
    ]);

    return {
      movements: movements.map(toInventoryMovementResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  listVendorLowStockProducts: async (vendorId: string) => {
    const products =
      await inventoryRepository.listVendorLowStockProducts(vendorId);

    const lowStockProducts = products.filter(
      (product) => product.stock <= product.lowStockThreshold,
    );

    return {
      products: lowStockProducts.map(toLowStockProductResponse),
      total: lowStockProducts.length,
    };
  },
};
