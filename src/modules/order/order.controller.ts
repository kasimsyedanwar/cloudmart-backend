import { Request, Response } from 'express';

import { OrderService } from './order.service';
import { catchAsync } from '../../common/utils/catchAsync';
import { sendResponse } from '../../common/utils/sendResponse';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await OrderService.createOrder(userId, req.body);

  return sendResponse(res, 201, {
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await OrderService.getMyOrders(userId);

  return sendResponse(res, 200, {
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const id = req.params.id as string;

  const result = await OrderService.getSingleOrder(userId, userRole, id);

  return sendResponse(res, 200, {
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

export const OrderController = {
  createOrder,
  getMyOrders,
  getSingleOrder,
};
