import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  createProductReview,
  listApprovedProductReviews,
  listMyReviews,
  listReviewsForAdmin,
  updateReviewStatusForAdmin,
} from './review.controller';
import {
  createReviewBodySchema,
  listAdminReviewsQuerySchema,
  listMyReviewsQuerySchema,
  listProductReviewsQuerySchema,
  productReviewParamsSchema,
  reviewIdParamsSchema,
  updateReviewStatusBodySchema,
} from './review.validation';

const router = Router();

router.get(
  '/products/:id/reviews',
  validateRequest({
    params: productReviewParamsSchema,
    query: listProductReviewsQuerySchema,
  }),
  asyncHandler(listApprovedProductReviews),
);

router.post(
  '/products/:id/reviews',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: productReviewParamsSchema,
    body: createReviewBodySchema,
  }),
  asyncHandler(createProductReview),
);

router.get(
  '/users/me/reviews',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    query: listMyReviewsQuerySchema,
  }),
  asyncHandler(listMyReviews),
);

router.get(
  '/admin/reviews',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listAdminReviewsQuerySchema,
  }),
  asyncHandler(listReviewsForAdmin),
);

router.patch(
  '/admin/reviews/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: reviewIdParamsSchema,
    body: updateReviewStatusBodySchema,
  }),
  asyncHandler(updateReviewStatusForAdmin),
);

export default router;
