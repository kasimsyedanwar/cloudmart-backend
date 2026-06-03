import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { requireApprovedVendor } from '../../common/middlewares/require-approved-vendor';
import { requireRole } from '../../common/middlewares/require-role';
import {
  createAdminDashboardSnapshot,
  createVendorDashboardSnapshot,
  getAdminDashboard,
  getVendorDashboard,
} from './dashboard.controller';

const router = Router();

router.get(
  '/admin/dashboard',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncHandler(getAdminDashboard),
);

router.post(
  '/admin/dashboard/snapshot',
  authenticate,
  requireRole(UserRole.ADMIN),
  asyncHandler(createAdminDashboardSnapshot),
);

router.get(
  '/vendor/dashboard',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  asyncHandler(getVendorDashboard),
);

router.post(
  '/vendor/dashboard/snapshot',
  authenticate,
  requireRole(UserRole.VENDOR),
  requireApprovedVendor,
  asyncHandler(createVendorDashboardSnapshot),
);

export default router;
