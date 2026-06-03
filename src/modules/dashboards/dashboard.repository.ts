import {
  DashboardScope,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  ReviewStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

export const dashboardRepository = {
  countUsers: async () => {
    return prisma.user.count();
  },

  countUsersByRole: async () => {
    return prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true,
      },
    });
  },

  countUsersByStatus: async () => {
    return prisma.user.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });
  },

  countVendorsByStatus: async () => {
    return prisma.vendorProfile.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });
  },

  countProductsByStatus: async (vendorId?: string) => {
    return prisma.product.groupBy({
      by: ['status'],
      where: {
        vendorId,
      },
      _count: {
        _all: true,
      },
    });
  },

  listLowStockProducts: async ({
    vendorId,
    take,
  }: {
    vendorId?: string;
    take: number;
  }) => {
    const products = await prisma.product.findMany({
      where: {
        vendorId,
        status: {
          not: ProductStatus.ARCHIVED,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        stock: true,
        lowStockThreshold: true,
        status: true,
        vendorId: true,
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            vendorProfile: {
              select: {
                storeName: true,
                slug: true,
              },
            },
          },
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
      take: 100,
    });

    return products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .slice(0, take);
  },

  countOrdersByStatus: async (vendorId?: string) => {
    return prisma.order.groupBy({
      by: ['status'],
      where: vendorId
        ? {
            items: {
              some: {
                vendorId,
              },
            },
          }
        : undefined,
      _count: {
        _all: true,
      },
    });
  },

  countOrdersByPaymentStatus: async (vendorId?: string) => {
    return prisma.order.groupBy({
      by: ['paymentStatus'],
      where: vendorId
        ? {
            items: {
              some: {
                vendorId,
              },
            },
          }
        : undefined,
      _count: {
        _all: true,
      },
    });
  },

  getAdminPaymentRevenue: async () => {
    return prisma.payment.aggregate({
      where: {
        status: PaymentStatus.SUCCESS,
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });
  },

  getVendorRevenue: async (vendorId: string) => {
    return prisma.orderItem.aggregate({
      where: {
        vendorId,
        order: {
          paymentStatus: PaymentStatus.SUCCESS,
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.CONFIRMED,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ],
          },
        },
      },
      _sum: {
        lineTotal: true,
        quantity: true,
      },
      _count: {
        _all: true,
      },
    });
  },

  countPaymentsByStatus: async () => {
    return prisma.payment.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });
  },

  countInventoryMovementsByType: async (vendorId?: string) => {
    return prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: vendorId
        ? {
            product: {
              vendorId,
            },
          }
        : undefined,
      _count: {
        _all: true,
      },
    });
  },

  countPendingReviews: async (vendorId?: string) => {
    return prisma.review.count({
      where: {
        status: ReviewStatus.PENDING,
        product: vendorId
          ? {
              vendorId,
            }
          : undefined,
      },
    });
  },

  getRecentOrders: async ({
    vendorId,
    take,
  }: {
    vendorId?: string;
    take: number;
  }) => {
    return prisma.order.findMany({
      where: vendorId
        ? {
            items: {
              some: {
                vendorId,
              },
            },
          }
        : undefined,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          where: vendorId
            ? {
                vendorId,
              }
            : undefined,
          select: {
            id: true,
            productId: true,
            vendorId: true,
            quantity: true,
            priceSnapshot: true,
            lineTotal: true,
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
    });
  },

  getRecentInventoryMovements: async ({
    vendorId,
    take,
  }: {
    vendorId?: string;
    take: number;
  }) => {
    return prisma.inventoryMovement.findMany({
      where: vendorId
        ? {
            product: {
              vendorId,
            },
          }
        : undefined,
      select: {
        id: true,
        productId: true,
        type: true,
        quantity: true,
        reason: true,
        stockBefore: true,
        stockAfter: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            vendorId: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
    });
  },

  createDashboardSnapshot: async ({
    scope,
    scopeId,
    metricsJson,
  }: {
    scope: DashboardScope;
    scopeId?: string;
    metricsJson: Prisma.InputJsonValue;
  }) => {
    return prisma.dashboardSnapshot.create({
      data: {
        scope,
        scopeId,
        date: new Date(),
        metricsJson,
      },
    });
  },
};
