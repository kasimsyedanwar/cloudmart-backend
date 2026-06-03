import { Router } from 'express';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { login, registerCustomer } from './auth.controller';
import { loginBodySchema, registerBodySchema } from './auth.validation';

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

export default router;
