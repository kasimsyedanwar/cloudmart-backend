import {
  Address,
  AddressType,
  CartStatus,
  InventoryMovementType,
  OrderStatus,
  PaymentEventType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Product,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;

const checkoutCartInclude = {
  items: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      product: {
        include: {
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
                  status: true,
                },
              },
            },
          },
          category: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

const orderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  items: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          stock: true,
          status: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
            take: 1,
          },
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
  payment: {
    include: {
      events: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type CheckoutCart = Prisma.CartGetPayload<{
  include: typeof checkoutCartInclude;
}>;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export type CheckoutOrderItemInput = {
  productId: string;
  vendorId: string;
  quantity: number;
  priceSnapshot: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
};

export const orderRepository = {
  findActiveCartForCheckout: async ({
    userId,
    tx,
  }: {
    userId: string;
    tx: PrismaTransactionClient;
  }): Promise<CheckoutCart | null> => {
    return tx.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
      include: checkoutCartInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findDefaultShippingAddress: async ({
    userId,
    tx,
  }: {
    userId: string;
    tx: PrismaTransactionClient;
  }): Promise<Address | null> => {
    return tx.address.findFirst({
      where: {
        userId,
        type: AddressType.SHIPPING,
        isDefault: true,
      },
    });
  },

  findAddressByIdForUser: async ({
    userId,
    addressId,
    tx,
  }: {
    userId: string;
    addressId: string;
    tx: PrismaTransactionClient;
  }): Promise<Address | null> => {
    return tx.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });
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

  findProductByIdForCheckout: async ({
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

  createOrderWithPayment: async ({
    customerId,
    orderNumber,
    subtotal,
    tax,
    shippingFee,
    total,
    shippingAddressSnapshot,
    items,
    tx,
  }: {
    customerId: string;
    orderNumber: string;
    subtotal: Prisma.Decimal;
    tax: Prisma.Decimal;
    shippingFee: Prisma.Decimal;
    total: Prisma.Decimal;
    shippingAddressSnapshot: Prisma.InputJsonValue;
    items: CheckoutOrderItemInput[];
    tx: PrismaTransactionClient;
  }): Promise<OrderWithRelations> => {
    return tx.order.create({
      data: {
        customer: {
          connect: {
            id: customerId,
          },
        },
        orderNumber,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal,
        tax,
        shippingFee,
        total,
        paymentStatus: PaymentStatus.PENDING,
        shippingAddressSnapshot,
        items: {
          create: items.map((item) => ({
            product: {
              connect: {
                id: item.productId,
              },
            },
            vendor: {
              connect: {
                id: item.vendorId,
              },
            },
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
            lineTotal: item.lineTotal,
          })),
        },
        payment: {
          create: {
            provider: PaymentProvider.MOCK,
            amount: total,
            currency: 'INR',
            status: PaymentStatus.PENDING,
            events: {
              create: {
                eventType: PaymentEventType.CREATED,
                rawPayload: {
                  source: 'checkout',
                  orderNumber,
                  status: PaymentStatus.PENDING,
                },
              },
            },
          },
        },
      },
      include: orderInclude,
    });
  },

  updateProductStockAfterCheckout: async ({
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

  createCheckoutInventoryMovement: async ({
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
        product: {
          connect: {
            id: productId,
          },
        },
        order: {
          connect: {
            id: orderId,
          },
        },
        actor: {
          connect: {
            id: actorId,
          },
        },
        type: InventoryMovementType.ORDER_DEDUCTED,
        quantity,
        reason,
        stockBefore,
        stockAfter,
      },
    });
  },

  clearAndCheckoutCart: async ({
    cartId,
    tx,
  }: {
    cartId: string;
    tx: PrismaTransactionClient;
  }): Promise<void> => {
    await tx.cartItem.deleteMany({
      where: {
        cartId,
      },
    });

    await tx.cart.update({
      where: {
        id: cartId,
      },
      data: {
        status: CartStatus.CHECKED_OUT,
      },
    });
  },

  listOrders: async ({
    where,
    skip,
    take,
  }: {
    where: Prisma.OrderWhereInput;
    skip: number;
    take: number;
  }): Promise<OrderWithRelations[]> => {
    return prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  },

  countOrders: async (where: Prisma.OrderWhereInput): Promise<number> => {
    return prisma.order.count({
      where,
    });
  },

  findOrderById: async (id: string): Promise<OrderWithRelations | null> => {
    return prisma.order.findUnique({
      where: {
        id,
      },
      include: orderInclude,
    });
  },

  updateOrderStatus: async ({
    orderId,
    status,
    paymentStatus,
  }: {
    orderId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<OrderWithRelations> => {
    return prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        paymentStatus,
      },
      include: orderInclude,
    });
  },
};
