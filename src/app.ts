import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import { errorHandler } from './common/middlewares/error-handler';
import { notFoundMiddleware } from './common/middlewares/not-found';
import { requestIdMiddleware } from './common/middlewares/request-id';
import { corsOptions } from './config/cors';
import routes from './routes';

const app: Application = express();

app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use('/', routes);

app.use(notFoundMiddleware);
app.use(errorHandler);

export default app;
