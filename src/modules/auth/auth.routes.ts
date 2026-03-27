import { Router } from 'express';
import { AuthController } from './auth.controller';
import {
  loginValidationSchema,
  logoutValidationSchema,
  registerValidationSchema,
  refreshTokenValidationSchema,
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

router.post(
  '/refresh-token',
  validateRequest(refreshTokenValidationSchema),
  AuthController.refreshToken,
);

router.post(
  '/logout',
  validateRequest(logoutValidationSchema),
  AuthController.logout,
);

router.get('/me', auth(), AuthController.getMe);
export const AuthRoutes = router;
