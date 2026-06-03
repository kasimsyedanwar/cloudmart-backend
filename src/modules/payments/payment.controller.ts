import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { paymentService } from './payment.service';
import {
  MockPaymentFailureInput,
  MockPaymentSuccessInput,
  PaymentIdParams,
} from './payment.validation';

export const getPaymentById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as PaymentIdParams;

  const result = await paymentService.getPaymentById({
    paymentId: params.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
  });

  res.status(200).json(
    successResponse({
      message: 'Payment fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const markMockPaymentSuccess = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as PaymentIdParams;

  const result = await paymentService.markMockPaymentSuccess({
    paymentId: params.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    input: req.body as MockPaymentSuccessInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Mock payment marked as successful',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const markMockPaymentFailure = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as PaymentIdParams;

  const result = await paymentService.markMockPaymentFailure({
    paymentId: params.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    input: req.body as MockPaymentFailureInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Mock payment marked as failed',
      requestId: req.requestId,
      data: result,
    }),
  );
};
