import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { CacheKeys } from '../../common/cache/cache-keys';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { cacheResponse } from '../../common/middlewares/cache-response';
import { invalidateCache } from '../../common/middlewares/invalidate-cache';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from './category.controller';
import {
  categoryIdParamsSchema,
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema,
} from './category.validation';

const router = Router();

const invalidateCategoryAndProductCache = invalidateCache({
  patterns: [
    CacheKeys.patterns.allCategories,
    CacheKeys.patterns.allProductLists,
    CacheKeys.patterns.allProductDetails,
  ],
});

router.get(
  '/categories',
  cacheResponse({
    ttlSeconds: 300,
    keyBuilder: CacheKeys.categoryList,
  }),
  validateRequest({
    query: listCategoriesQuerySchema,
  }),
  asyncHandler(listCategories),
);

router.get(
  '/categories/:id',
  cacheResponse({
    ttlSeconds: 300,
    keyBuilder: (req) => CacheKeys.categoryDetail(String(req.params.id)),
  }),
  validateRequest({
    params: categoryIdParamsSchema,
  }),
  asyncHandler(getCategoryById),
);

router.post(
  '/admin/categories',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    body: createCategoryBodySchema,
  }),
  invalidateCategoryAndProductCache,
  asyncHandler(createCategory),
);

router.patch(
  '/admin/categories/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: categoryIdParamsSchema,
    body: updateCategoryBodySchema,
  }),
  invalidateCategoryAndProductCache,
  asyncHandler(updateCategory),
);

router.delete(
  '/admin/categories/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: categoryIdParamsSchema,
  }),
  invalidateCategoryAndProductCache,
  asyncHandler(deleteCategory),
);

export default router;
