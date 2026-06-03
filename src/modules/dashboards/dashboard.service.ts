import { DashboardScope, Prisma } from '@prisma/client';
import { dashboardRepository } from './dashboard.repository';

type CountGroup<T extends string> = Record<T, number>;

const decimalToString = (value: Prisma.Decimal | null | undefined): string => {
  return value ? value.toFixed(2) : '0.00';
};

const toCountGroup = <T extends string>(
  rows: {
    [key: string]: unknown;
    _count: {
      _all: number;
    };
  }[],
  key: string,
): CountGroup<T> => {
  return rows.reduce((acc, row) => {
    const groupKey = row[key] as T;

    acc[groupKey] = row._count._all;

    return acc;
  }, {} as CountGroup<T>);
};

const formatRecentOrders = (
  orders: Awaited<ReturnType<typeof dashboardRepository.getRecentOrders>>,
) => {
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: decimalToString(order.total),
    customer: order.customer,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      vendorId: item.vendorId,
      quantity: item.quantity,
      priceSnapshot: decimalToString(item.priceSnapshot),
      lineTotal: decimalToString(item.lineTotal),
      product: item.product,
    })),
    createdAt: order.createdAt,
  }));
};

const formatRecentInventoryMovements = (
  movements: Awaited<
    ReturnType<typeof dashboardRepository.getRecentInventoryMovements>
  >,
) => {
  return movements.map((movement) => ({
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    product: movement.product,
    actor: movement.actor,
    createdAt: movement.createdAt,
  }));
};

export const dashboardService = {
  getAdminDashboard: async () => {
    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      vendorsByStatus,
      productsByStatus,
      lowStockProducts,
      ordersByStatus,
      ordersByPaymentStatus,
      paymentRevenue,
      paymentsByStatus,
      inventoryMovementsByType,
      pendingReviews,
      recentOrders,
      recentInventoryMovements,
    ] = await Promise.all([
      dashboardRepository.countUsers(),
      dashboardRepository.countUsersByRole(),
      dashboardRepository.countUsersByStatus(),
      dashboardRepository.countVendorsByStatus(),
      dashboardRepository.countProductsByStatus(),
      dashboardRepository.listLowStockProducts({
        take: 10,
      }),
      dashboardRepository.countOrdersByStatus(),
      dashboardRepository.countOrdersByPaymentStatus(),
      dashboardRepository.getAdminPaymentRevenue(),
      dashboardRepository.countPaymentsByStatus(),
      dashboardRepository.countInventoryMovementsByType(),
      dashboardRepository.countPendingReviews(),
      dashboardRepository.getRecentOrders({
        take: 10,
      }),
      dashboardRepository.getRecentInventoryMovements({
        take: 10,
      }),
    ]);

    return {
      scope: DashboardScope.ADMIN,
      generatedAt: new Date(),
      users: {
        total: totalUsers,
        byRole: toCountGroup(usersByRole, 'role'),
        byStatus: toCountGroup(usersByStatus, 'status'),
      },
      vendors: {
        byStatus: toCountGroup(vendorsByStatus, 'status'),
      },
      products: {
        byStatus: toCountGroup(productsByStatus, 'status'),
        lowStock: lowStockProducts.map((product) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          status: product.status,
          vendor: {
            id: product.vendor.id,
            name: product.vendor.name,
            email: product.vendor.email,
            storeName: product.vendor.vendorProfile?.storeName ?? null,
            storeSlug: product.vendor.vendorProfile?.slug ?? null,
          },
        })),
      },
      orders: {
        byStatus: toCountGroup(ordersByStatus, 'status'),
        byPaymentStatus: toCountGroup(ordersByPaymentStatus, 'paymentStatus'),
        recent: formatRecentOrders(recentOrders),
      },
      payments: {
        successfulPaymentCount: paymentRevenue._count._all,
        successfulRevenue: decimalToString(paymentRevenue._sum.amount),
        byStatus: toCountGroup(paymentsByStatus, 'status'),
      },
      inventory: {
        movementsByType: toCountGroup(inventoryMovementsByType, 'type'),
        recentMovements: formatRecentInventoryMovements(
          recentInventoryMovements,
        ),
      },
      reviews: {
        pending: pendingReviews,
      },
    };
  },

  getVendorDashboard: async (vendorId: string) => {
    const [
      productsByStatus,
      lowStockProducts,
      ordersByStatus,
      ordersByPaymentStatus,
      vendorRevenue,
      inventoryMovementsByType,
      pendingReviews,
      recentOrders,
      recentInventoryMovements,
    ] = await Promise.all([
      dashboardRepository.countProductsByStatus(vendorId),
      dashboardRepository.listLowStockProducts({
        vendorId,
        take: 10,
      }),
      dashboardRepository.countOrdersByStatus(vendorId),
      dashboardRepository.countOrdersByPaymentStatus(vendorId),
      dashboardRepository.getVendorRevenue(vendorId),
      dashboardRepository.countInventoryMovementsByType(vendorId),
      dashboardRepository.countPendingReviews(vendorId),
      dashboardRepository.getRecentOrders({
        vendorId,
        take: 10,
      }),
      dashboardRepository.getRecentInventoryMovements({
        vendorId,
        take: 10,
      }),
    ]);

    return {
      scope: DashboardScope.VENDOR,
      scopeId: vendorId,
      generatedAt: new Date(),
      products: {
        byStatus: toCountGroup(productsByStatus, 'status'),
        lowStock: lowStockProducts.map((product) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          status: product.status,
        })),
      },
      orders: {
        byStatus: toCountGroup(ordersByStatus, 'status'),
        byPaymentStatus: toCountGroup(ordersByPaymentStatus, 'paymentStatus'),
        recent: formatRecentOrders(recentOrders),
      },
      revenue: {
        successfulOrderItems: vendorRevenue._count._all,
        unitsSold: vendorRevenue._sum.quantity ?? 0,
        grossRevenue: decimalToString(vendorRevenue._sum.lineTotal),
      },
      inventory: {
        movementsByType: toCountGroup(inventoryMovementsByType, 'type'),
        recentMovements: formatRecentInventoryMovements(
          recentInventoryMovements,
        ),
      },
      reviews: {
        pending: pendingReviews,
      },
    };
  },

  createAdminSnapshot: async () => {
    const metrics = await dashboardService.getAdminDashboard();

    const snapshot = await dashboardRepository.createDashboardSnapshot({
      scope: DashboardScope.ADMIN,
      metricsJson: metrics as Prisma.InputJsonValue,
    });

    return {
      snapshot,
      metrics,
    };
  },

  createVendorSnapshot: async (vendorId: string) => {
    const metrics = await dashboardService.getVendorDashboard(vendorId);

    const snapshot = await dashboardRepository.createDashboardSnapshot({
      scope: DashboardScope.VENDOR,
      scopeId: vendorId,
      metricsJson: metrics as Prisma.InputJsonValue,
    });

    return {
      snapshot,
      metrics,
    };
  },
};
