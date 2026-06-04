import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CacheKeys } from '../../common/cache/cache-keys';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { invalidateCache } from '../../common/middlewares/invalidate-cache';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  getPaymentById,
  markMockPaymentFailure,
  markMockPaymentSuccess,
} from './payment.controller';
import {
  mockPaymentFailureBodySchema,
  mockPaymentSuccessBodySchema,
  paymentIdParamsSchema,
} from './payment.validation';

const router = Router();

const invalidateProductCache = invalidateCache({
  patterns: [
    CacheKeys.patterns.allProductLists,
    CacheKeys.patterns.allProductDetails,
  ],
});

router.get(
  '/payments/:id',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN),
  validateRequest({
    params: paymentIdParamsSchema,
  }),
  asyncHandler(getPaymentById),
);

router.post(
  '/payments/:id/mock-success',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN),
  validateRequest({
    params: paymentIdParamsSchema,
    body: mockPaymentSuccessBodySchema,
  }),
  asyncHandler(markMockPaymentSuccess),
);

router.post(
  '/payments/:id/mock-failure',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.ADMIN),
  validateRequest({
    params: paymentIdParamsSchema,
    body: mockPaymentFailureBodySchema,
  }),
  invalidateProductCache,
  asyncHandler(markMockPaymentFailure),
);

export default router;
