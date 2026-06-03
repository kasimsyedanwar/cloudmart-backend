import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { orderService } from './order.service';
import { CheckoutInput } from './order.validation';

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
