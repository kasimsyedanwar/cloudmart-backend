import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import routes from './routes';

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', routes);

export default app;
