import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import router from './routes';
import { logger } from './config/logger';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();
app.use(requestIdMiddleware);

app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: req.requestId,
    }),
  }),
);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api/v1', router);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
