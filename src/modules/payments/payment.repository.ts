import {
  InventoryMovementType,
  OrderStatus,
  Payment,
  PaymentEvent,
  PaymentEventType,
  PaymentStatus,
  Prisma,
  Product,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;

const paymentInclude = {
  order: {
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              stock: true,
              status: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              vendorProfile: {
                select: {
                  id: true,
                  storeName: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  },
  events: {
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.PaymentInclude;

export type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentInclude;
}>;

export const paymentRepository = {
  lockPaymentRow: async ({
    paymentId,
    tx,
  }: {
    paymentId: string;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.$queryRaw`
      SELECT id FROM public."Payment"
      WHERE id = CAST(${paymentId} AS uuid)
      FOR UPDATE
    `;
  },

  lockProductRow: async ({
    productId,
    tx,
  }: {
    productId: string;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.$queryRaw`
      SELECT id FROM public."Product"
      WHERE id = CAST(${productId} AS uuid)
      FOR UPDATE
    `;
  },

  findPaymentById: async ({
    paymentId,
    tx,
  }: {
    paymentId: string;
    tx?: PrismaTransactionClient;
  }): Promise<PaymentWithRelations | null> => {
    const client = tx ?? prisma;

    return client.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: paymentInclude,
    });
  },

  updatePayment: async ({
    paymentId,
    status,
    providerRef,
    paidAt,
    tx,
  }: {
    paymentId: string;
    status: PaymentStatus;
    providerRef?: string;
    paidAt?: Date | null;
    tx: PrismaTransactionClient;
  }): Promise<Payment> => {
    return tx.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status,
        providerRef,
        paidAt,
      },
    });
  },

  updateOrderPaymentState: async ({
    orderId,
    orderStatus,
    paymentStatus,
    tx,
  }: {
    orderId: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: orderStatus,
        paymentStatus,
      },
    });
  },

  createPaymentEvent: async ({
    paymentId,
    eventType,
    rawPayload,
    tx,
  }: {
    paymentId: string;
    eventType: PaymentEventType;
    rawPayload: Prisma.InputJsonValue;
    tx: PrismaTransactionClient;
  }): Promise<PaymentEvent> => {
    return tx.paymentEvent.create({
      data: {
        paymentId,
        eventType,
        rawPayload,
      },
    });
  },

  findProductByIdForRestore: async ({
    productId,
    tx,
  }: {
    productId: string;
    tx: PrismaTransactionClient;
  }): Promise<Product | null> => {
    return tx.product.findUnique({
      where: {
        id: productId,
      },
    });
  },

  updateProductStockAfterPaymentFailure: async ({
    productId,
    stockAfter,
    status,
    tx,
  }: {
    productId: string;
    stockAfter: number;
    status: ProductStatus;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.product.update({
      where: {
        id: productId,
      },
      data: {
        stock: stockAfter,
        status,
      },
    });
  },

  createStockRestoreMovement: async ({
    productId,
    orderId,
    actorId,
    quantity,
    reason,
    stockBefore,
    stockAfter,
    tx,
  }: {
    productId: string;
    orderId: string;
    actorId: string;
    quantity: number;
    reason: string;
    stockBefore: number;
    stockAfter: number;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.inventoryMovement.create({
      data: {
        productId,
        orderId,
        actorId,
        type: InventoryMovementType.ORDER_CANCELLED_ADJUSTMENT,
        quantity,
        reason,
        stockBefore,
        stockAfter,
      },
    });
  },
};
