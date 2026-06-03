import { Request, Response } from 'express';

import { successResponse } from '../../common/utils/api-response';
import { orderService } from './order.service';
import {
  CheckoutInput,
  ListAdminOrdersQuery,
  ListMyOrdersQuery,
  ListVendorOrdersQuery,
  OrderIdParams,
  UpdateOrderStatusInput,
} from './order.validation';

export const checkout = async (req: Request, res: Response): Promise<void> => {
  const result = await orderService.checkout({
    userId: req.user!.id,
    input: req.body as CheckoutInput,
  });

  res.status(201).json(
    successResponse({
      message: 'Checkout completed successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listMyOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await orderService.listMyOrders({
    userId: req.user!.id,
    query: req.query as unknown as ListMyOrdersQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'Orders fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getMyOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as OrderIdParams;

  const result = await orderService.getMyOrderById({
    userId: req.user!.id,
    orderId: params.id,
  });

  res.status(200).json(
    successResponse({
      message: 'Order fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listVendorOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await orderService.listVendorOrders({
    vendorId: req.user!.id,
    query: req.query as unknown as ListVendorOrdersQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'Vendor orders fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getVendorOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as OrderIdParams;

  const result = await orderService.getVendorOrderById({
    vendorId: req.user!.id,
    orderId: params.id,
  });

  res.status(200).json(
    successResponse({
      message: 'Vendor order fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listOrdersForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await orderService.listOrdersForAdmin(
    req.query as unknown as ListAdminOrdersQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Admin orders fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getOrderByIdForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as OrderIdParams;

  const result = await orderService.getOrderByIdForAdmin(params.id);

  res.status(200).json(
    successResponse({
      message: 'Admin order fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateOrderStatusForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as OrderIdParams;

  const result = await orderService.updateOrderStatusForAdmin({
    orderId: params.id,
    input: req.body as UpdateOrderStatusInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Order status updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};
