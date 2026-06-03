import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import { checkout } from './order.controller';
import { checkoutBodySchema } from './order.validation';

const router = Router();

router.post(
  '/orders/checkout',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    body: checkoutBodySchema,
  }),
  asyncHandler(checkout),
);

export default router;
