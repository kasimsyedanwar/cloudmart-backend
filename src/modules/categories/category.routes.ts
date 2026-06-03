import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
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

router.get(
  '/categories',
  validateRequest({
    query: listCategoriesQuerySchema,
  }),
  asyncHandler(listCategories),
);

router.get(
  '/categories/:id',
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
  asyncHandler(updateCategory),
);

router.delete(
  '/admin/categories/:id',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: categoryIdParamsSchema,
  }),
  asyncHandler(deleteCategory),
);

export default router;
