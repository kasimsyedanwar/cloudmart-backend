import { Router } from 'express';

import { OrderController } from './order.controller';
import {
  createOrderValidationSchema,
  orderIdParamValidationSchema,
} from './order.validation';
import { validateRequest } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';

const router = Router();

router.post(
  '/',
  auth(),
  validateRequest(createOrderValidationSchema),
  OrderController.createOrder,
);

router.get('/my-orders', auth(), OrderController.getMyOrders);

router.get(
  '/:id',
  auth(),
  validateRequest(orderIdParamValidationSchema),
  OrderController.getSingleOrder,
);

export const OrderRoutes = router;
