import { CorsOptions } from 'cors';
import env from './env';

const isWildcardOrigin = env.CORS_ORIGIN === '*';

export const corsOptions: CorsOptions = {
  origin: isWildcardOrigin
    ? '*'
    : env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: !isWildcardOrigin,
};
