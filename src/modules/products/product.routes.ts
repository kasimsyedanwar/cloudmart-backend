import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CacheKeys } from '../../common/cache/cache-keys';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { cacheResponse } from '../../common/middlewares/cache-response';
import { invalidateCache } from '../../common/middlewares/invalidate-cache';
import { requireApprovedVendor } from '../../common/middlewares/require-approved-vendor';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  archiveVendorProduct,
  createVendorProduct,
  getPublicProductById,
  listProductsForAdmin,
  listPublicProducts,
  listVendorProducts,
  updateProductStatusForAdmin,
  updateVendorProduct,
} from './product.controller';
import {
  createProductBodySchema,
  listAdminProductsQuerySchema,
  listPublicProductsQuerySchema,
  listVendorProductsQuerySchema,
  productIdParamsSchema,
  updateProductBodySchema,
  updateProductStatusBodySchema,
} from './product.validation';

const router = Router();

const invalidateProductCache = invalidateCache({
  patterns: [
    CacheKeys.patterns.allProductLists,
    CacheKeys.patterns.allProductDetails,
  ],
});

router.get(
  '/products',
  cacheResponse({
    ttlSeconds: 60,
    keyBuilder: CacheKeys.productList,
  }),
  validateRequest({
    query: listPublicProductsQuerySchema,
  }),
  asyncHandler(listPublicProducts),
);

router.get(
  '/products/:id',
  cacheResponse({
    ttlSeconds: 60,
    keyBuilder: (req) => CacheKeys.productDetail(String(req.params.id)),
  }),
  validateRequest({
    params: productIdParamsSchema,
  }),
  asyncHandler(getPublicProductById),
);

router.post(
  '/vendor/products',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  validateRequest({
    body: createProductBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(createVendorProduct),
);

router.get(
  '/vendor/products',
  authenticate,
  requireRole(UserRole.VENDOR),
  validateRequest({
    query: listVendorProductsQuerySchema,
  }),
  asyncHandler(listVendorProducts),
);

router.patch(
  '/vendor/products/:id',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  validateRequest({
    params: productIdParamsSchema,
    body: updateProductBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(updateVendorProduct),
);

router.delete(
  '/vendor/products/:id',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  validateRequest({
    params: productIdParamsSchema,
  }),
  invalidateProductCache,
  asyncHandler(archiveVendorProduct),
);

router.get(
  '/admin/products',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listAdminProductsQuerySchema,
  }),
  asyncHandler(listProductsForAdmin),
);

router.patch(
  '/admin/products/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: productIdParamsSchema,
    body: updateProductStatusBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(updateProductStatusForAdmin),
);

export default router;
