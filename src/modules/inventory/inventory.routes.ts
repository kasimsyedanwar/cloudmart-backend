import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { CacheKeys } from '../../common/cache/cache-keys';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { invalidateCache } from '../../common/middlewares/invalidate-cache';
import { requireApprovedVendor } from '../../common/middlewares/require-approved-vendor';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  adjustVendorProductStock,
  listAdminInventoryMovements,
  listVendorInventoryMovements,
  listVendorLowStockProducts,
} from './inventory.controller';
import {
  adjustStockBodySchema,
  listInventoryMovementsQuerySchema,
} from './inventory.validation';

const router = Router();

const invalidateProductCache = invalidateCache({
  patterns: [
    CacheKeys.patterns.allProductLists,
    CacheKeys.patterns.allProductDetails,
  ],
});

router.post(
  '/vendor/inventory/adjust',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  validateRequest({
    body: adjustStockBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(adjustVendorProductStock),
);

router.get(
  '/vendor/inventory/movements',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  validateRequest({
    query: listInventoryMovementsQuerySchema,
  }),
  asyncHandler(listVendorInventoryMovements),
);

router.get(
  '/vendor/inventory/low-stock',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  asyncHandler(listVendorLowStockProducts),
);

router.get(
  '/admin/inventory/movements',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listInventoryMovementsQuerySchema,
  }),
  asyncHandler(listAdminInventoryMovements),
);

export default router;
