import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { requireRole } from '../../common/middlewares/require-role';
import {
  adminOnly,
  authenticatedOnly,
  customerOnly,
  vendorOnly,
} from './rbac.controller';

const router = Router();

router.get('/authenticated', authenticate, authenticatedOnly);

router.get('/admin-only', authenticate, requireRole(UserRole.ADMIN), adminOnly);

router.get(
  '/vendor-only',
  authenticate,
  requireRole(UserRole.VENDOR),
  vendorOnly,
);

router.get(
  '/customer-only',
  authenticate,
  requireRole(UserRole.CUSTOMER),
  customerOnly,
);

export default router;
