import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { authService } from './auth.service';
import {
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from './auth.validation';

export const registerCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.registerCustomer(req.body as RegisterInput);

  res.status(201).json(
    successResponse({
      message: 'Customer registered successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body as LoginInput);

  res.status(200).json(
    successResponse({
      message: 'Login successful',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await authService.refreshToken(req.body as RefreshTokenInput);

  res.status(200).json(
    successResponse({
      message: 'Token refreshed successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(req.body as LogoutInput);

  res.status(200).json(
    successResponse({
      message: 'Logout successful',
      requestId: req.requestId,
    }),
  );
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.getMe(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Authenticated user fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};
