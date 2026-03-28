import { Router } from 'express';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { sendResponse } from '../common/utils/sendResponse';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { OrderRoutes } from '../modules/order/order.routes';
import { TestRoutes } from './test.routes';
import { ProductRoutes } from '../modules/product/product.routes';

const router = Router();

router.get('/health', (_req, res) => {
  return sendResponse(res, 200, {
    success: true,
    message: 'server is healthy',
    data: {
      uptime: process.uptime(),
      timeStamp: new Date().toISOString(),
    },
  });
});

router.get('/ready', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    return sendResponse(res, 200, {
      success: true,
      message: 'Server is ready',
      data: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    next(error);
  }
});
router.use('/auth', AuthRoutes);
router.use('/products', ProductRoutes);
router.use('/orders', OrderRoutes);
router.use('/test', TestRoutes);
export default router;
