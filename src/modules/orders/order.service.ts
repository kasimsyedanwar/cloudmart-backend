import { randomBytes } from 'crypto';
import {
  Address,
  OrderStatus,
  PaymentStatus,
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
  CheckoutInput,
  ListAdminOrdersQuery,
  ListMyOrdersQuery,
  ListVendorOrdersQuery,
  UpdateOrderStatusInput,
} from './order.validation';
import {
  CheckoutOrderItemInput,
  orderRepository,
  OrderWithRelations,
} from './order.repository';

type OrderResponse = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  tax: string;
  shippingFee: string;
  total: string;
  shippingAddressSnapshot: Prisma.JsonValue | null;
  customer: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  items: {
    id: string;
    productId: string;
    vendorId: string;
    quantity: number;
    priceSnapshot: string;
    lineTotal: string;
    product: {
      id: string;
      title: string;
      slug: string;
      stock: number;
      status: ProductStatus;
      imageUrl: string | null;
    };
    vendor: {
      id: string;
      name: string;
      email: string;
      storeName: string | null;
      storeSlug: string | null;
    };
  }[];
  payment: {
    id: string;
    provider: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    providerRef: string | null;
    paidAt: Date | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

type CheckoutResponse = {
  order: OrderResponse;
};

type StockDeductionPlan = {
  productId: string;
  stockBefore: number;
  stockAfter: number;
  quantity: number;
  nextStatus: ProductStatus;
};

const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex').toUpperCase();

  return `CM-${timestamp}-${random}`;
};

const decimalToString = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const createShippingAddressSnapshot = (
  address: Address,
): Prisma.InputJsonValue => {
  return {
    id: address.id,
    type: address.type,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
};

const getNextProductStatusAfterCheckout = ({
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

  return currentStatus;
};

const assertProductCanCheckout = ({
  product,
  quantity,
}: {
  product: Product | null;
  quantity: number;
}): Product => {
  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw new AppError({
      message: 'Product is not available for checkout',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (product.stock < quantity) {
    throw new AppError({
      message: `Insufficient stock for product ${product.title}. Available: ${product.stock}`,
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  return product;
};

const toOrderResponse = (order: OrderWithRelations): OrderResponse => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: decimalToString(order.subtotal),
    tax: decimalToString(order.tax),
    shippingFee: decimalToString(order.shippingFee),
    total: decimalToString(order.total),
    shippingAddressSnapshot: order.shippingAddressSnapshot,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      role: order.customer.role,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      vendorId: item.vendorId,
      quantity: item.quantity,
      priceSnapshot: decimalToString(item.priceSnapshot),
      lineTotal: decimalToString(item.lineTotal),
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        stock: item.product.stock,
        status: item.product.status,
        imageUrl: item.product.images[0]?.url ?? null,
      },
      vendor: {
        id: item.vendor.id,
        name: item.vendor.name,
        email: item.vendor.email,
        storeName: item.vendor.vendorProfile?.storeName ?? null,
        storeSlug: item.vendor.vendorProfile?.slug ?? null,
      },
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          amount: decimalToString(order.payment.amount),
          currency: order.payment.currency,
          status: order.payment.status,
          providerRef: order.payment.providerRef,
          paidAt: order.payment.paidAt,
        }
      : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const assertCustomerCanViewOrder = ({
  order,
  userId,
}: {
  order: OrderWithRelations | null;
  userId: string;
}): OrderWithRelations => {
  if (!order || order.customerId !== userId) {
    throw new AppError({
      message: 'Order not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return order;
};

const assertVendorCanViewOrder = ({
  order,
  vendorId,
}: {
  order: OrderWithRelations | null;
  vendorId: string;
}): OrderWithRelations => {
  if (!order || !order.items.some((item) => item.vendorId === vendorId)) {
    throw new AppError({
      message: 'Order not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return {
    ...order,
    items: order.items.filter((item) => item.vendorId === vendorId),
  };
};

const buildAdminSearchWhere = (
  search?: string,
): Prisma.OrderWhereInput | undefined => {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      {
        orderNumber: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        customer: {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        customer: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ],
  };
};

const validateAdminStatusTransition = ({
  currentStatus,
  nextStatus,
}: {
  currentStatus: OrderStatus;
  nextStatus: OrderStatus;
}): void => {
  if (currentStatus === OrderStatus.CANCELLED) {
    throw new AppError({
      message: 'Cancelled order status cannot be changed',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (currentStatus === OrderStatus.REFUNDED) {
    throw new AppError({
      message: 'Refunded order status cannot be changed',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (
    nextStatus !== OrderStatus.CANCELLED &&
    currentStatus === OrderStatus.PENDING_PAYMENT
  ) {
    throw new AppError({
      message: 'Pending payment order cannot move to fulfillment status',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }
};

const getPaymentStatusForOrderStatus = ({
  currentPaymentStatus,
  nextOrderStatus,
}: {
  currentPaymentStatus: PaymentStatus;
  nextOrderStatus: OrderStatus;
}): PaymentStatus | undefined => {
  if (nextOrderStatus === OrderStatus.REFUNDED) {
    return PaymentStatus.REFUNDED;
  }

  if (nextOrderStatus === OrderStatus.CANCELLED) {
    return currentPaymentStatus;
  }

  return undefined;
};

export const orderService = {
  checkout: async ({
    userId,
    input,
  }: {
    userId: string;
    input: CheckoutInput;
  }): Promise<CheckoutResponse> => {
    const order = await prisma.$transaction(
      async (tx) => {
        const cart = await orderRepository.findActiveCartForCheckout({
          userId,
          tx,
        });

        if (!cart || cart.items.length === 0) {
          throw new AppError({
            message: 'Cart is empty',
            statusCode: 400,
            code: ErrorCodes.BAD_REQUEST,
          });
        }

        const shippingAddress = input.shippingAddressId
          ? await orderRepository.findAddressByIdForUser({
              userId,
              addressId: input.shippingAddressId,
              tx,
            })
          : await orderRepository.findDefaultShippingAddress({
              userId,
              tx,
            });

        if (!shippingAddress) {
          throw new AppError({
            message: 'Shipping address not found',
            statusCode: 400,
            code: ErrorCodes.BAD_REQUEST,
          });
        }

        const sortedCartItems = [...cart.items].sort((a, b) =>
          a.productId.localeCompare(b.productId),
        );

        const orderItems: CheckoutOrderItemInput[] = [];
        const stockDeductionPlans: StockDeductionPlan[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const item of sortedCartItems) {
          await orderRepository.lockProductRow({
            productId: item.productId,
            tx,
          });

          const product = await orderRepository.findProductByIdForCheckout({
            productId: item.productId,
            tx,
          });

          const activeProduct = assertProductCanCheckout({
            product,
            quantity: item.quantity,
          });

          const priceSnapshot = activeProduct.price;
          const lineTotal = priceSnapshot.mul(item.quantity);
          const stockBefore = activeProduct.stock;
          const stockAfter = stockBefore - item.quantity;

          subtotal = subtotal.add(lineTotal);

          orderItems.push({
            productId: activeProduct.id,
            vendorId: activeProduct.vendorId,
            quantity: item.quantity,
            priceSnapshot,
            lineTotal,
          });

          stockDeductionPlans.push({
            productId: activeProduct.id,
            stockBefore,
            stockAfter,
            quantity: item.quantity,
            nextStatus: getNextProductStatusAfterCheckout({
              currentStatus: activeProduct.status,
              stockAfter,
            }),
          });
        }

        const tax = new Prisma.Decimal(0);
        const shippingFee = new Prisma.Decimal(0);
        const total = subtotal.add(tax).add(shippingFee);
        const orderNumber = generateOrderNumber();

        const createdOrder = await orderRepository.createOrderWithPayment({
          customerId: userId,
          orderNumber,
          subtotal,
          tax,
          shippingFee,
          total,
          shippingAddressSnapshot:
            createShippingAddressSnapshot(shippingAddress),
          items: orderItems,
          tx,
        });

        for (const deduction of stockDeductionPlans) {
          await orderRepository.updateProductStockAfterCheckout({
            productId: deduction.productId,
            stockAfter: deduction.stockAfter,
            status: deduction.nextStatus,
            tx,
          });

          await orderRepository.createCheckoutInventoryMovement({
            productId: deduction.productId,
            orderId: createdOrder.id,
            actorId: userId,
            quantity: deduction.quantity,
            reason: `Checkout stock deduction for order ${orderNumber}`,
            stockBefore: deduction.stockBefore,
            stockAfter: deduction.stockAfter,
            tx,
          });
        }

        await orderRepository.clearAndCheckoutCart({
          cartId: cart.id,
          tx,
        });

        return createdOrder;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return {
      order: toOrderResponse(order),
    };
  },

  listMyOrders: async ({
    userId,
    query,
  }: {
    userId: string;
    query: ListMyOrdersQuery;
  }) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.OrderWhereInput = {
      customerId: userId,
      status: query.status,
      paymentStatus: query.paymentStatus,
    };

    const [orders, total] = await Promise.all([
      orderRepository.listOrders({
        where,
        skip,
        take,
      }),
      orderRepository.countOrders(where),
    ]);

    return {
      orders: orders.map(toOrderResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  getMyOrderById: async ({
    userId,
    orderId,
  }: {
    userId: string;
    orderId: string;
  }): Promise<OrderResponse> => {
    const order = await orderRepository.findOrderById(orderId);

    const ownedOrder = assertCustomerCanViewOrder({
      order,
      userId,
    });

    return toOrderResponse(ownedOrder);
  },

  listVendorOrders: async ({
    vendorId,
    query,
  }: {
    vendorId: string;
    query: ListVendorOrdersQuery;
  }) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.OrderWhereInput = {
      status: query.status,
      items: {
        some: {
          vendorId,
        },
      },
    };

    const [orders, total] = await Promise.all([
      orderRepository.listOrders({
        where,
        skip,
        take,
      }),
      orderRepository.countOrders(where),
    ]);

    return {
      orders: orders.map((order) =>
        toOrderResponse({
          ...order,
          items: order.items.filter((item) => item.vendorId === vendorId),
        }),
      ),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  getVendorOrderById: async ({
    vendorId,
    orderId,
  }: {
    vendorId: string;
    orderId: string;
  }): Promise<OrderResponse> => {
    const order = await orderRepository.findOrderById(orderId);

    const vendorOrder = assertVendorCanViewOrder({
      order,
      vendorId,
    });

    return toOrderResponse(vendorOrder);
  },

  listOrdersForAdmin: async (query: ListAdminOrdersQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.OrderWhereInput = {
      status: query.status,
      paymentStatus: query.paymentStatus,
      customerId: query.customerId,
      items: query.vendorId
        ? {
            some: {
              vendorId: query.vendorId,
            },
          }
        : undefined,
      ...buildAdminSearchWhere(query.search),
    };

    const [orders, total] = await Promise.all([
      orderRepository.listOrders({
        where,
        skip,
        take,
      }),
      orderRepository.countOrders(where),
    ]);

    return {
      orders: orders.map(toOrderResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  getOrderByIdForAdmin: async (orderId: string): Promise<OrderResponse> => {
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError({
        message: 'Order not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    return toOrderResponse(order);
  },

  updateOrderStatusForAdmin: async ({
    orderId,
    input,
  }: {
    orderId: string;
    input: UpdateOrderStatusInput;
  }): Promise<OrderResponse> => {
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError({
        message: 'Order not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    validateAdminStatusTransition({
      currentStatus: order.status,
      nextStatus: input.status,
    });

    const paymentStatus = getPaymentStatusForOrderStatus({
      currentPaymentStatus: order.paymentStatus,
      nextOrderStatus: input.status,
    });

    const updatedOrder = await orderRepository.updateOrderStatus({
      orderId,
      status: input.status,
      paymentStatus,
    });

    return toOrderResponse(updatedOrder);
  },
};
