import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import {
  login,
  logout,
  me,
  refreshToken,
  registerCustomer,
} from './auth.controller';
import {
  loginBodySchema,
  logoutBodySchema,
  refreshTokenBodySchema,
  registerBodySchema,
} from './auth.validation';

const router = Router();

router.post(
  '/register',
  validateRequest({
    body: registerBodySchema,
  }),
  asyncHandler(registerCustomer),
);

router.post(
  '/login',
  validateRequest({
    body: loginBodySchema,
  }),
  asyncHandler(login),
);

router.post(
  '/refresh-token',
  validateRequest({
    body: refreshTokenBodySchema,
  }),
  asyncHandler(refreshToken),
);

router.post(
  '/logout',
  validateRequest({
    body: logoutBodySchema,
  }),
  asyncHandler(logout),
);

router.get('/me', authenticate, asyncHandler(me));

export default router;
