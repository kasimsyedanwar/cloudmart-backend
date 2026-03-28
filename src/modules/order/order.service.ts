import { prisma } from '../../config/db';
import { AppError } from '../../common/errors/AppError';

const createOrder = async (
  userId: string,
  payload: {
    items: {
      productId: string;
      quantity: number;
    }[];
  },
) => {
  const productIds = payload.items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  let totalAmount = 0;

  const orderItemsData = payload.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for product: ${product.title}`,
        400,
      );
    }

    const unitPrice = product.price;
    const totalPrice = unitPrice * item.quantity;

    totalAmount += totalPrice;

    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        totalAmount,
      },
    });

    for (const item of orderItemsData) {
      await tx.orderItem.create({
        data: {
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      await tx.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return tx.order.findUnique({
      where: {
        id: createdOrder.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
              },
            },
          },
        },
      },
    });
  });

  return order;
};

const getMyOrders = async (userId: string) => {
  return prisma.order.findMany({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const getSingleOrder = async (userId: string, userRole: string, id: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not allowed to access this order', 403);
  }

  return order;
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getSingleOrder,
};
