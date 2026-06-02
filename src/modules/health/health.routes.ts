import { Router } from 'express';
import { healthCheck, readinessCheck } from './health.controller';

const router = Router();
router.use('/health', healthCheck);
router.use('/ready', readinessCheck);

export default router;
