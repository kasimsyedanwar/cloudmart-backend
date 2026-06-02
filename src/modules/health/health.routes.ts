import { Router } from 'express';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { healthCheck, readinessCheck } from './health.controller';

const router = Router();

router.get('/health', healthCheck);
router.get('/ready', asyncHandler(readinessCheck));

export default router;
