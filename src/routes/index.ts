import { Router } from 'express';
import { successResponse } from '../common/utils/api-response';
import authRoutes from '../modules/auth/auth.routes';
import healthRoutes from '../modules/health/health.routes';

const router = Router();

router.use('/', healthRoutes);

router.get('/api/v1', (req, res) => {
  res.status(200).json(
    successResponse({
      message: 'CloudMart API v1 is ready',
      requestId: req.requestId,
      data: {
        version: 'v1',
      },
    }),
  );
});

router.use('/api/v1/auth', authRoutes);

export default router;
