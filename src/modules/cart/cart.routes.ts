import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  addItemToCart,
  clearMyCart,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from './cart.controller';
import {
  addCartItemBodySchema,
  cartItemIdParamsSchema,
  updateCartItemBodySchema,
} from './cart.validation';

const router = Router();

router.get(
  '/cart',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  asyncHandler(getMyCart),
);

router.post(
  '/cart/items',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    body: addCartItemBodySchema,
  }),
  asyncHandler(addItemToCart),
);

router.patch(
  '/cart/items/:itemId',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: cartItemIdParamsSchema,
    body: updateCartItemBodySchema,
  }),
  asyncHandler(updateCartItem),
);

router.delete(
  '/cart/items/:itemId',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: cartItemIdParamsSchema,
  }),
  asyncHandler(removeCartItem),
);

router.delete(
  '/cart/clear',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  asyncHandler(clearMyCart),
);

export default router;
