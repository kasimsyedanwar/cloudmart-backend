import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  createMyAddress,
  deleteMyAddress,
  getMe,
  getMyAddressById,
  listMyAddresses,
  listUsersForAdmin,
  updateMe,
  updateMyAddress,
  updateUserStatusForAdmin,
} from './user.controller';
import {
  addressIdParamsSchema,
  createAddressBodySchema,
  listUsersQuerySchema,
  updateAddressBodySchema,
  updateMeBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
} from './user.validation';

const router = Router();

router.get('/users/me', authenticate, asyncHandler(getMe));

router.patch(
  '/users/me',
  authenticate,
  validateRequest({
    body: updateMeBodySchema,
  }),
  asyncHandler(updateMe),
);

router.get(
  '/users/me/addresses',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  asyncHandler(listMyAddresses),
);

router.post(
  '/users/me/addresses',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    body: createAddressBodySchema,
  }),
  asyncHandler(createMyAddress),
);

router.get(
  '/users/me/addresses/:addressId',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: addressIdParamsSchema,
  }),
  asyncHandler(getMyAddressById),
);

router.patch(
  '/users/me/addresses/:addressId',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: addressIdParamsSchema,
    body: updateAddressBodySchema,
  }),
  asyncHandler(updateMyAddress),
);

router.delete(
  '/users/me/addresses/:addressId',
  authenticate,
  requireRole(UserRole.CUSTOMER, UserRole.VENDOR),
  validateRequest({
    params: addressIdParamsSchema,
  }),
  asyncHandler(deleteMyAddress),
);

router.get(
  '/admin/users',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listUsersQuerySchema,
  }),
  asyncHandler(listUsersForAdmin),
);

router.patch(
  '/admin/users/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: userIdParamsSchema,
    body: updateUserStatusBodySchema,
  }),
  asyncHandler(updateUserStatusForAdmin),
);

export default router;
