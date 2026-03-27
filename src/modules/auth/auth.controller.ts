import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { catchAsync } from '../../common/utils/catchAsync';
import { sendResponse } from '../../common/utils/sendResponse';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);
  return sendResponse(res, 201, {
    success: true,
    message: 'user registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  return sendResponse(res, 200, {
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.refreshAccessToken(refreshToken);
  return sendResponse(res, 200, {
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await AuthService.logoutUser(refreshToken);
  return sendResponse(res, 200, {
    success: true,
    message: 'logout successfully',
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await AuthService.getMe(userId);

  return sendResponse(res, 200, {
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

export const AuthController = { register, login, refreshToken, logout, getMe };
