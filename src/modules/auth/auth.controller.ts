import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { authService } from './auth.service';
import { LoginInput, RegisterInput } from './auth.validation';

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
