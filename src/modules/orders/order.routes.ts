import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CacheKeys } from '../../common/cache/cache-keys';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { invalidateCache } from '../../common/middlewares/invalidate-cache';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  checkout,
  getMyOrderById,
  getOrderByIdForAdmin,
  getVendorOrderById,
  listMyOrders,
  listOrdersForAdmin,
  listVendorOrders,
  updateOrderStatusForAdmin,
} from './order.controller';
import {
  checkoutBodySchema,
  listAdminOrdersQuerySchema,
  listMyOrdersQuerySchema,
  listVendorOrdersQuerySchema,
  orderIdParamsSchema,
  updateOrderStatusBodySchema,
} from './order.validation';

const router = Router();

const invalidateProductCache = invalidateCache({
  patterns: [
    CacheKeys.patterns.allProductLists,
    CacheKeys.patterns.allProductDetails,
  ],
});

router.post(
  '/orders/checkout',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    body: checkoutBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(checkout),
);

router.get(
  '/orders/my',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    query: listMyOrdersQuerySchema,
  }),
  asyncHandler(listMyOrders),
);

router.get(
  '/orders/my/:id',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: orderIdParamsSchema,
  }),
  asyncHandler(getMyOrderById),
);

router.get(
  '/vendor/orders',
  authenticate,
  requireRole(UserRole.VENDOR),
  validateRequest({
    query: listVendorOrdersQuerySchema,
  }),
  asyncHandler(listVendorOrders),
);

router.get(
  '/vendor/orders/:id',
  authenticate,
  requireRole(UserRole.VENDOR),
  validateRequest({
    params: orderIdParamsSchema,
  }),
  asyncHandler(getVendorOrderById),
);

router.get(
  '/admin/orders',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listAdminOrdersQuerySchema,
  }),
  asyncHandler(listOrdersForAdmin),
);

router.get(
  '/admin/orders/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: orderIdParamsSchema,
  }),
  asyncHandler(getOrderByIdForAdmin),
);

router.patch(
  '/admin/orders/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: orderIdParamsSchema,
    body: updateOrderStatusBodySchema,
  }),
  asyncHandler(updateOrderStatusForAdmin),
);

export default router;
