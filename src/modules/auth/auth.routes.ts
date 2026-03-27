import { Router } from 'express';
import { AuthController } from './auth.controller';
import {
  loginValidationSchema,
  registerValidationSchema,
} from './auth.validations';
import { validateRequest } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';

const router = Router();

router.post(
  '/register',
  validateRequest(registerValidationSchema),
  AuthController.register,
);

router.post(
  '/login',
  validateRequest(loginValidationSchema),
  AuthController.login,
);

router.get('/me', auth(), AuthController.getMe);
export const AuthRoutes = router;
