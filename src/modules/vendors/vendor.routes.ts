import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireRole } from '../../common/middlewares/require-role';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  approveVendor,
  getMyVendorProfile,
  listVendorsForAdmin,
  registerVendor,
  updateMyVendorProfile,
  updateVendorStatus,
} from './vendor.controller';
import {
  listVendorsQuerySchema,
  registerVendorBodySchema,
  updateVendorBodySchema,
  updateVendorStatusBodySchema,
  vendorIdParamsSchema,
} from './vendor.validation';

const router = Router();

router.post(
  '/vendors/register',
  authenticate,
  requireRole(UserRole.CUSTOMER),
  validateRequest({
    body: registerVendorBodySchema,
  }),
  asyncHandler(registerVendor),
);

router.get(
  '/vendors/me',
  authenticate,
  requireRole(UserRole.VENDOR),
  asyncHandler(getMyVendorProfile),
);

router.patch(
  '/vendors/me',
  authenticate,
  requireRole(UserRole.VENDOR),
  validateRequest({
    body: updateVendorBodySchema,
  }),
  asyncHandler(updateMyVendorProfile),
);

router.get(
  '/admin/vendors',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    query: listVendorsQuerySchema,
  }),
  asyncHandler(listVendorsForAdmin),
);

router.patch(
  '/admin/vendors/:id/approve',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: vendorIdParamsSchema,
  }),
  asyncHandler(approveVendor),
);

router.patch(
  '/admin/vendors/:id/status',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: vendorIdParamsSchema,
    body: updateVendorStatusBodySchema,
  }),
  asyncHandler(updateVendorStatus),
);

export default router;
