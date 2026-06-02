import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';

const router = Router();
router.use('/', healthRoutes);
router.use('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudMart API v1 is ready',
  });
});

export default router;
