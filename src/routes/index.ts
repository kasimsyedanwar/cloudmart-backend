import { Router } from 'express';

import { successResponse } from '../common/utils/api-response';
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

export default router;
